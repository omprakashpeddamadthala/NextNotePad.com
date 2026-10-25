import { MIRROR_META_DIR, type MirrorTarget } from "./mirrorPlan";

/**
 * Applies a mirror plan to a directory handle. Kept free of app state so it
 * can be exercised against an in-memory directory in tests.
 *
 * Nothing is hard-deleted except plaintext copies of notes that were since
 * locked: removed files go to `.nextnotepad/trash/<run>/`, and anything on
 * disk the mirror didn't write itself is copied to
 * `.nextnotepad/local-changes/<run>/` before being overwritten.
 */

const MANIFEST_FILE = "manifest.json";
const MANIFEST_SCHEMA_VERSION = 1;
const WRITE_CONCURRENCY = 4;
const MANIFEST_SAVE_EVERY = 25;

export interface ManifestEntry {
  workspaceId: string;
  path: string;
  version: number;
  /** `lastModified` of the local file right after the mirror wrote it. */
  lastModified: number;
}

export interface Manifest {
  schemaVersion: number;
  userId: string;
  files: Record<string, ManifestEntry>;
}

export class PermissionLostError extends Error {
  constructor() {
    super("Access to the local folder was revoked");
    this.name = "PermissionLostError";
  }
}

export interface ReconcileInput {
  dir: FileSystemDirectoryHandle;
  manifest: Manifest;
  plan: Map<string, MirrorTarget>;
  /** Every workspace that still exists in Drive. */
  knownWorkspaceIds: Set<string>;
  /** Workspaces whose tree loaded; files of the others are left untouched. */
  loadedWorkspaceIds: Set<string>;
  /** Re-check files that look current (restores ones deleted on disk). */
  full: boolean;
  /** Just-saved content, used instead of downloading from Drive. */
  pendingContent: Map<string, string>;
  readContent: (target: MirrorTarget) => Promise<string>;
  onProgress?: (done: number, total: number) => void;
}

export interface ReconcileResult {
  failed: number;
  changes: number;
}

interface RunContext {
  dir: FileSystemDirectoryHandle;
  m: Manifest;
  claimed: Set<string>;
  runStamp: string;
  changes: number;
}

export async function reconcileMirror(input: ReconcileInput): Promise<ReconcileResult> {
  const { dir, manifest: m, plan, pendingContent } = input;
  const claimed = new Set(
    [...plan.values()].filter((t) => !t.locked).map((t) => t.path.toLowerCase()),
  );
  const runStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const ctx: RunContext = { dir, m, claimed, runStamp, changes: 0 };
  const jobs: Array<() => Promise<void>> = [];

  for (const [fileId, entry] of Object.entries(m.files)) {
    const target = plan.get(fileId);
    if (target && !target.locked) continue;
    const workspaceGone = !input.knownWorkspaceIds.has(entry.workspaceId);
    if (!target && !workspaceGone && !input.loadedWorkspaceIds.has(entry.workspaceId)) {
      continue;
    }
    jobs.push(async () => {
      await removeEntry(ctx, fileId, entry, Boolean(target?.locked));
      pendingContent.delete(fileId);
    });
  }

  for (const target of plan.values()) {
    if (target.locked) continue;
    const prev = m.files[target.fileId];
    const pending = pendingContent.get(target.fileId);
    const upToDate = Boolean(
      prev &&
        prev.path === target.path &&
        prev.version === target.version &&
        pending === undefined,
    );
    if (upToDate && !input.full) continue;
    jobs.push(async () => {
      const content = await writeTarget(ctx, target, prev, pending, upToDate, input.readContent);
      if (content !== undefined && pendingContent.get(target.fileId) === pending) {
        pendingContent.delete(target.fileId);
      }
    });
  }

  let done = 0;
  let failed = 0;
  input.onProgress?.(done, jobs.length);
  await runPool(jobs, WRITE_CONCURRENCY, async (job) => {
    try {
      await job();
    } catch (err) {
      if (isPermissionError(err)) throw new PermissionLostError();
      failed++;
      console.warn("Local mirror: file sync failed", err);
    }
    done++;
    input.onProgress?.(done, jobs.length);
    if (ctx.changes > 0 && ctx.changes % MANIFEST_SAVE_EVERY === 0) {
      await writeManifest(dir, m);
    }
  });

  if (ctx.changes > 0) await writeManifest(dir, m);
  return { failed, changes: ctx.changes };
}

/** Returns the written content, or undefined when the file was already current. */
async function writeTarget(
  ctx: RunContext,
  target: MirrorTarget,
  prev: ManifestEntry | undefined,
  pending: string | undefined,
  upToDate: boolean,
  readContent: (target: MirrorTarget) => Promise<string>,
): Promise<string | undefined> {
  const existing = await statFile(ctx.dir, target.path);
  if (upToDate && existing) return undefined;

  const content = pending ?? (await readContent(target));

  // Back up whatever is on disk at this path unless the mirror wrote it
  // (any manifest entry, since another note may have moved out of this path).
  if (existing) {
    const key = target.path.toLowerCase();
    const writtenByMirror = Object.values(ctx.m.files).some(
      (e) => e.path.toLowerCase() === key && e.lastModified === existing.lastModified,
    );
    if (!writtenByMirror && (await existing.text()) !== content) {
      await copyToMeta(ctx, "local-changes", target.path, existing);
    }
  }

  const lastModified = await writeText(ctx.dir, target.path, content);

  if (prev && prev.path !== target.path && !ctx.claimed.has(prev.path.toLowerCase())) {
    await removeLocal(ctx, prev, "trash-if-edited");
  }

  ctx.m.files[target.fileId] = {
    workspaceId: target.workspaceId,
    path: target.path,
    version: target.version,
    lastModified,
  };
  ctx.changes++;
  return content;
}

async function removeEntry(
  ctx: RunContext,
  fileId: string,
  entry: ManifestEntry,
  locked: boolean,
): Promise<void> {
  if (!ctx.claimed.has(entry.path.toLowerCase())) {
    // A newly locked note must not stay readable on disk, not even in trash.
    await removeLocal(ctx, entry, locked ? "delete" : "trash");
  }
  delete ctx.m.files[fileId];
  ctx.changes++;
}

/**
 * `trash` always keeps a copy; `trash-if-edited` (renames/moves, where the new
 * copy already exists) keeps one only if the user changed the file on disk.
 */
async function removeLocal(
  ctx: RunContext,
  entry: ManifestEntry,
  mode: "trash" | "trash-if-edited" | "delete",
): Promise<void> {
  const file = await statFile(ctx.dir, entry.path);
  if (!file) return;
  const edited = file.lastModified !== entry.lastModified;
  if (mode === "trash") {
    await copyToMeta(ctx, "trash", entry.path, file);
  } else if (mode === "trash-if-edited" && edited) {
    await copyToMeta(ctx, "local-changes", entry.path, file);
  }
  await removeFile(ctx.dir, entry.path);
}

async function copyToMeta(
  ctx: RunContext,
  bucket: "trash" | "local-changes",
  path: string,
  file: File,
): Promise<void> {
  await writeText(
    ctx.dir,
    `${MIRROR_META_DIR}/${bucket}/${ctx.runStamp}/${path}`,
    await file.text(),
  );
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export async function readManifest(
  dir: FileSystemDirectoryHandle,
  userId: string,
): Promise<Manifest> {
  const empty: Manifest = { schemaVersion: MANIFEST_SCHEMA_VERSION, userId, files: {} };
  const file = await statFile(dir, `${MIRROR_META_DIR}/${MANIFEST_FILE}`);
  if (!file) return empty;
  let parsed: Partial<Manifest>;
  try {
    parsed = JSON.parse(await file.text()) as Partial<Manifest>;
  } catch {
    return empty;
  }
  if (parsed.userId && parsed.userId !== userId) {
    throw new Error(
      "This folder is already used by another account. Choose a different folder.",
    );
  }
  return {
    ...empty,
    files: parsed.files && typeof parsed.files === "object" ? parsed.files : {},
  };
}

async function writeManifest(dir: FileSystemDirectoryHandle, m: Manifest): Promise<void> {
  await writeText(dir, `${MIRROR_META_DIR}/${MANIFEST_FILE}`, JSON.stringify(m, null, 2));
}

// ---------------------------------------------------------------------------
// File System Access helpers
// ---------------------------------------------------------------------------

function split(path: string): { dirs: string[]; name: string } {
  const parts = path.split("/").filter(Boolean);
  const name = parts.pop() ?? "";
  return { dirs: parts, name };
}

async function getDir(
  dir: FileSystemDirectoryHandle,
  segments: string[],
  create: boolean,
): Promise<FileSystemDirectoryHandle | null> {
  let current = dir;
  for (const segment of segments) {
    try {
      current = await current.getDirectoryHandle(segment, { create });
    } catch (err) {
      if (!create && isNotFound(err)) return null;
      throw err;
    }
  }
  return current;
}

async function statFile(dir: FileSystemDirectoryHandle, path: string): Promise<File | null> {
  const { dirs, name } = split(path);
  const parent = await getDir(dir, dirs, false);
  if (!parent) return null;
  try {
    return await (await parent.getFileHandle(name)).getFile();
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

async function writeText(
  dir: FileSystemDirectoryHandle,
  path: string,
  content: string,
): Promise<number> {
  const { dirs, name } = split(path);
  const parent = await getDir(dir, dirs, true);
  const handle = await parent!.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
  return (await handle.getFile()).lastModified;
}

/** Removes a file, then any parent folders it leaves empty. */
async function removeFile(dir: FileSystemDirectoryHandle, path: string): Promise<void> {
  const { dirs, name } = split(path);
  const parent = await getDir(dir, dirs, false);
  if (!parent) return;
  try {
    await parent.removeEntry(name);
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
  for (let depth = dirs.length; depth > 0; depth--) {
    const container = await getDir(dir, dirs.slice(0, depth - 1), false);
    try {
      // Non-recursive: throws (and stops pruning) if the folder isn't empty.
      await container?.removeEntry(dirs[depth - 1]);
    } catch {
      return;
    }
  }
}

function isNotFound(err: unknown): boolean {
  const name = (err as DOMException)?.name;
  return name === "NotFoundError" || name === "TypeMismatchError";
}

export function isPermissionError(err: unknown): boolean {
  return (err as DOMException)?.name === "NotAllowedError";
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) await worker(items[index++]);
  });
  await Promise.all(lanes);
}
