import { detectLanguageFromFilename } from "@/lib/constants/languages";
import { AppConfigService } from "./appConfigService";
import {
  APP_CONFIG_FILE_NAME,
  DriveNotFoundError,
  FOLDER_MIME,
  WORKSPACE_META_FILE_NAME,
  type DriveEntry,
  type DriveService,
} from "./driveService";

export const DEFAULT_WORKSPACE_NAME = "My Workspace";
const WORKSPACE_META_SCHEMA_VERSION = 1;

/** Per-node metadata the editor needs that Drive has no native field for, stored as Drive
 *  `appProperties` on the node itself (so it travels with the file — no side table). */
const P = {
  kind: "nnp_kind",
  language: "nnp_lang",
  encoding: "nnp_enc",
  hidden: "nnp_hidden",
  collapsed: "nnp_collapsed",
  locked: "nnp_locked",
  salt: "nnp_salt",
  iv: "nnp_iv",
} as const;

const bool = (v: string | undefined, fallback: boolean) =>
  v === undefined ? fallback : v === "1";
const flag = (v: boolean) => (v ? "1" : "0");

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface WorkspaceRecordDto {
  id: string;
  name: string;
  description: string | null;
  driveWorkspaceFolderId: string;
  createdAt: string;
  updatedAt: string;
}

export function workspaceToDto(e: DriveEntry): WorkspaceRecordDto {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    driveWorkspaceFolderId: e.id,
    createdAt: new Date(e.createdTime).toISOString(),
    updatedAt: new Date(e.modifiedTime).toISOString(),
  };
}

export function isFolder(e: DriveEntry) {
  return e.mimeType === FOLDER_MIME;
}

/** App-internal files (`.workspace.json`, `.appConfig.json`) never appear in the file tree. */
export function isInternalEntry(e: DriveEntry) {
  return (
    e.name === WORKSPACE_META_FILE_NAME ||
    e.name === APP_CONFIG_FILE_NAME ||
    e.appProperties[P.kind] === "workspaceMeta"
  );
}

export function entryToNodeDto(
  e: DriveEntry,
  parentId: string | null,
  path: string,
) {
  const base = {
    id: e.id,
    name: e.name,
    path,
    parentId,
    createdAt: e.createdTime,
    updatedAt: e.modifiedTime,
    lastSynced: e.modifiedTime,
    version: e.version,
    checksum: null,
    deleted: false,
    hidden: bool(e.appProperties[P.hidden], false),
  };
  if (isFolder(e)) {
    return {
      ...base,
      type: "folder" as const,
      collapsed: bool(e.appProperties[P.collapsed], true),
    };
  }
  return {
    ...base,
    type: "file" as const,
    language: e.appProperties[P.language] ?? detectLanguageFromFilename(e.name),
    encoding: e.appProperties[P.encoding] ?? "UTF-8",
    size: e.size,
    pinnedFavorite: false,
    locked: bool(e.appProperties[P.locked], false),
    encryptionSalt: e.appProperties[P.salt] ?? null,
    encryptionIv: e.appProperties[P.iv] ?? null,
  };
}
export type NodeDto = ReturnType<typeof entryToNodeDto>;

export function fileProps(input: {
  language?: string;
  encoding?: string;
  hidden?: boolean;
  locked?: boolean;
  encryptionSalt?: string | null;
  encryptionIv?: string | null;
}): Record<string, string | null> {
  const props: Record<string, string | null> = {};
  if (input.language !== undefined) props[P.language] = input.language;
  if (input.encoding !== undefined) props[P.encoding] = input.encoding;
  if (input.hidden !== undefined) props[P.hidden] = flag(input.hidden);
  if (input.locked !== undefined) props[P.locked] = flag(input.locked);
  if (input.encryptionSalt !== undefined) props[P.salt] = input.encryptionSalt;
  if (input.encryptionIv !== undefined) props[P.iv] = input.encryptionIv;
  return props;
}

export function folderProps(input: {
  collapsed?: boolean;
  hidden?: boolean;
}): Record<string, string> {
  const props: Record<string, string> = {};
  if (input.collapsed !== undefined) props[P.collapsed] = flag(input.collapsed);
  if (input.hidden !== undefined) props[P.hidden] = flag(input.hidden);
  return props;
}

function stripNulls(
  props: Record<string, string | null>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(props).filter(([, v]) => v !== null),
  ) as Record<string, string>;
}

/** Drive's query language has a length cap, so a level of the tree is fetched in chunks. */
const PARENTS_PER_QUERY = 40;

// ----- workspaces -----

export async function listWorkspaceEntries(
  ds: DriveService,
): Promise<DriveEntry[]> {
  const parent = await ds.ensureWorkspacesFolder();
  const children = await ds.listChildren(parent);
  return children
    .filter(isFolder)
    .sort((a, b) => a.createdTime - b.createdTime);
}

async function writeWorkspaceMeta(
  ds: DriveService,
  folder: DriveEntry,
): Promise<void> {
  const meta = {
    schemaVersion: WORKSPACE_META_SCHEMA_VERSION,
    id: folder.id,
    name: folder.name,
    description: folder.description,
    createdAt: new Date(folder.createdTime).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const body = JSON.stringify(meta, null, 2);
  const existing = await ds.findChild(folder.id, WORKSPACE_META_FILE_NAME, {
    folder: false,
  });
  if (existing)
    await ds.update(existing.id, {
      content: body,
      mimeType: "application/json",
    });
  else
    await ds.createFile(WORKSPACE_META_FILE_NAME, folder.id, body, {
      mimeType: "application/json",
      appProperties: { [P.kind]: "workspaceMeta" },
    });
}

export async function createWorkspaceFolder(
  ds: DriveService,
  name: string,
  description?: string | null,
): Promise<DriveEntry> {
  const parent = await ds.ensureWorkspacesFolder();
  const folder = await ds.createFolder(
    name,
    parent,
    { [P.kind]: "workspace" },
    description ?? undefined,
  );
  await writeWorkspaceMeta(ds, folder);
  return folder;
}

/** Lists workspaces, creating the default one for a brand-new account. */
export async function listWorkspaces(ds: DriveService): Promise<DriveEntry[]> {
  const list = await listWorkspaceEntries(ds);
  if (list.length > 0) return list;
  return [await createWorkspaceFolder(ds, DEFAULT_WORKSPACE_NAME)];
}

/** The active workspace comes from `.appConfig.json`; a stale/missing pointer falls back to the
 *  first workspace and is repaired. Uses the cached config, so on the hot path this is free. */
export async function resolveActiveWorkspaceId(
  ds: DriveService,
): Promise<string> {
  const configs = new AppConfigService(ds);
  const config = await configs.load();
  if (config.activeWorkspaceId) return config.activeWorkspaceId;
  const list = await listWorkspaces(ds);
  const id = list[0].id;
  await configs.update((c) => {
    c.activeWorkspaceId = id;
  });
  return id;
}

export async function setActiveWorkspace(
  ds: DriveService,
  workspaceId: string | null,
): Promise<void> {
  await new AppConfigService(ds).update((c) => {
    c.activeWorkspaceId = workspaceId;
  });
}

export async function getWorkspace(
  ds: DriveService,
  id: string,
): Promise<DriveEntry> {
  const [entry, parent] = await Promise.all([
    ds.get(id).catch(() => null),
    ds.ensureWorkspacesFolder(),
  ]);
  if (
    !entry ||
    entry.trashed ||
    !isFolder(entry) ||
    !entry.parents.includes(parent)
  ) {
    throw new AppError("Workspace not found.", 404);
  }
  return entry;
}

export async function renameWorkspace(
  ds: DriveService,
  id: string,
  patch: { name?: string; description?: string | null },
) {
  const current = await getWorkspace(ds, id);
  if (patch.name && patch.name !== current.name) {
    const siblings = await listWorkspaceEntries(ds);
    if (siblings.some((w) => w.id !== id && w.name === patch.name)) {
      throw new AppError(
        `A workspace named "${patch.name}" already exists.`,
        409,
      );
    }
  }
  const updated = await ds.update(id, {
    name: patch.name,
    description: patch.description,
  });
  await writeWorkspaceMeta(ds, updated);
  return updated;
}

// ----- tree -----

/** Breadth-first walk of a workspace folder: one batched `files.list` per tree level (chunked
 *  by parent), rather than one request per folder. */
export async function loadWorkspaceTree(
  ds: DriveService,
  workspaceId: string,
): Promise<NodeDto[]> {
  const nodes: NodeDto[] = [];
  const pathOf = new Map<string, string>([[workspaceId, ""]]);
  let frontier = [workspaceId];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (let i = 0; i < frontier.length; i += PARENTS_PER_QUERY) {
      const chunk = frontier.slice(i, i + PARENTS_PER_QUERY);
      const q = `(${chunk.map((id) => `'${id}' in parents`).join(" or ")}) and trashed = false`;
      const entries = await ds.list(q);
      for (const e of entries) {
        if (isInternalEntry(e)) continue;
        const parent = e.parents.find((p) => pathOf.has(p));
        if (parent === undefined || pathOf.has(e.id)) continue;
        const path = `${pathOf.get(parent)}/${e.name}`;
        pathOf.set(e.id, path);
        nodes.push(
          entryToNodeDto(e, parent === workspaceId ? null : parent, path),
        );
        if (isFolder(e)) next.push(e.id);
      }
    }
    frontier = next;
  }
  return nodes;
}

/** Builds the slash path of `id` (relative to the workspace) by walking up its parents. */
export async function pathFor(
  ds: DriveService,
  entry: DriveEntry,
  workspaceId: string,
): Promise<string> {
  const names = [entry.name];
  let parentId = entry.parents[0];
  for (
    let depth = 0;
    parentId && parentId !== workspaceId && depth < 64;
    depth++
  ) {
    const parent = await ds.get(parentId);
    names.unshift(parent.name);
    parentId = parent.parents[0];
  }
  return `/${names.join("/")}`;
}

/** Resolves a client-facing parent id (null = workspace root) to a Drive folder id. */
export async function resolveParent(
  ds: DriveService,
  workspaceId: string,
  parentId: string | null,
): Promise<string> {
  if (!parentId) return workspaceId;
  const parent = await ds.get(parentId).catch((err) => {
    if (err instanceof DriveNotFoundError)
      throw new AppError("Parent folder not found", 404);
    throw err;
  });
  if (parent.trashed || !isFolder(parent))
    throw new AppError("Parent folder not found", 404);
  return parent.id;
}

async function isAncestor(
  ds: DriveService,
  ancestorId: string,
  candidateId: string,
  stopAt: string,
): Promise<boolean> {
  let current: string | undefined = candidateId;
  for (let depth = 0; current && current !== stopAt && depth < 64; depth++) {
    if (current === ancestorId) return true;
    current = (await ds.get(current)).parents[0];
  }
  return false;
}

export async function nodeDto(
  ds: DriveService,
  entry: DriveEntry,
  workspaceId: string,
): Promise<NodeDto> {
  const parent = entry.parents[0] ?? null;
  return entryToNodeDto(
    entry,
    parent === workspaceId ? null : parent,
    await pathFor(ds, entry, workspaceId),
  );
}

export async function createNode(
  ds: DriveService,
  workspaceId: string,
  input: {
    type: "file" | "folder";
    parentId: string | null;
    name: string;
    content?: string;
    language?: string;
    encoding?: string;
  },
): Promise<DriveEntry> {
  const parent = await resolveParent(ds, workspaceId, input.parentId);
  if (input.type === "folder")
    return ds.createFolder(
      input.name,
      parent,
      folderProps({ collapsed: true }),
    );
  return ds.createFile(input.name, parent, input.content ?? "", {
    appProperties: stripNulls(
      fileProps({
        language: input.language ?? detectLanguageFromFilename(input.name),
        encoding: input.encoding ?? "UTF-8",
      }),
    ),
  });
}

export async function getNode(
  ds: DriveService,
  id: string,
): Promise<DriveEntry> {
  const entry = await ds.get(id).catch((err) => {
    if (err instanceof DriveNotFoundError) throw new AppError("Not found", 404);
    throw err;
  });
  if (entry.trashed) throw new AppError("Not found", 404);
  return entry;
}

export interface NodePatch {
  name?: string;
  parentId?: string | null;
  content?: string;
  language?: string;
  encoding?: string;
  hidden?: boolean;
  collapsed?: boolean;
  locked?: boolean;
  encryptionSalt?: string | null;
  encryptionIv?: string | null;
}

/** Applies a file/folder patch in a single Drive `files.update` (metadata + media together).
 *  A content-only patch (the autosave hot path) skips the metadata read entirely. */
export async function updateNode(
  ds: DriveService,
  workspaceId: string,
  id: string,
  patch: NodePatch,
): Promise<DriveEntry> {
  const keys = Object.keys(patch).filter(
    (k) => patch[k as keyof NodePatch] !== undefined,
  );
  if (keys.length === 1 && keys[0] === "content") {
    try {
      return await ds.update(id, { content: patch.content });
    } catch (err) {
      if (err instanceof DriveNotFoundError)
        throw new AppError("Not found", 404);
      throw err;
    }
  }

  const current = await getNode(ds, id);
  const folder = isFolder(current);

  let moveTo: { parentId: string; fromParentId?: string } | undefined;
  if (patch.parentId !== undefined) {
    const target = await resolveParent(ds, workspaceId, patch.parentId);
    if (
      folder &&
      (target === id || (await isAncestor(ds, id, target, workspaceId)))
    ) {
      throw new AppError(
        "A folder can't be moved into itself or a descendant",
        400,
      );
    }
    if (!current.parents.includes(target))
      moveTo = { parentId: target, fromParentId: current.parents.join(",") };
  }

  const props: Record<string, string | null> = folder
    ? folderProps({ collapsed: patch.collapsed, hidden: patch.hidden })
    : fileProps(patch);
  // Renaming without an explicit language keeps the language in step with the new extension.
  if (
    !folder &&
    patch.name !== undefined &&
    patch.name !== current.name &&
    patch.language === undefined
  ) {
    props[P.language] = detectLanguageFromFilename(patch.name);
  }

  return ds.update(id, {
    name: patch.name,
    moveTo,
    appProperties: Object.keys(props).length > 0 ? props : undefined,
    content: folder ? undefined : patch.content,
  });
}

export async function trashNode(ds: DriveService, id: string): Promise<void> {
  await getNode(ds, id);
  await ds.trash(id);
}

/** Every file in every workspace, for the cross-workspace Quick Open index — one paginated
 *  listing of the app's Drive entries, joined to workspaces in memory. */
export async function listAllFiles(ds: DriveService) {
  const [workspaces, all] = await Promise.all([
    listWorkspaceEntries(ds),
    ds.listAllAppEntries(),
  ]);
  const byId = new Map(all.map((e) => [e.id, e]));
  const wsById = new Map(workspaces.map((w) => [w.id, w]));
  const resolved = new Map<
    string,
    { workspace: DriveEntry; path: string } | null
  >();

  function resolve(
    e: DriveEntry,
    depth = 0,
  ): { workspace: DriveEntry; path: string } | null {
    if (resolved.has(e.id)) return resolved.get(e.id)!;
    let out: { workspace: DriveEntry; path: string } | null = null;
    const parentId = e.parents[0];
    if (parentId && depth < 64) {
      const ws = wsById.get(parentId);
      if (ws) out = { workspace: ws, path: `/${e.name}` };
      else {
        const parent = byId.get(parentId);
        const up = parent ? resolve(parent, depth + 1) : null;
        out = up
          ? { workspace: up.workspace, path: `${up.path}/${e.name}` }
          : null;
      }
    }
    resolved.set(e.id, out);
    return out;
  }

  return all
    .filter((e) => !isFolder(e) && !isInternalEntry(e))
    .map((e) => ({ e, loc: resolve(e) }))
    .filter(
      (
        x,
      ): x is { e: DriveEntry; loc: { workspace: DriveEntry; path: string } } =>
        x.loc !== null,
    )
    .sort((a, b) => b.e.modifiedTime - a.e.modifiedTime)
    .map(({ e, loc }) => ({
      id: e.id,
      name: e.name,
      path: loc.path,
      language:
        e.appProperties[P.language] ?? detectLanguageFromFilename(e.name),
      size: e.size,
      workspaceId: loc.workspace.id,
      workspaceName: loc.workspace.name,
      updatedAt: new Date(e.modifiedTime).toISOString(),
    }));
}

export { stripNulls };
