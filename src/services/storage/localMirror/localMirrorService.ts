import { createStore, del, get, set, type UseStore } from "idb-keyval";
import type { WorkspaceNode } from "@/types/file";
import { useAuthStore } from "@/store/authStore";
import { useLocalMirrorStore } from "@/store/localMirrorStore";
import { useMultiWorkspaceStore } from "@/store/multiWorkspaceStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  getCachedWorkspaceTreeSync,
  loadWorkspaceList,
  loadWorkspaceTree,
  readDriveFileContent,
} from "../driveDataClient";
import { buildMirrorPlan, type MirrorWorkspace } from "./mirrorPlan";
import {
  PermissionLostError,
  readManifest,
  reconcileMirror,
  type Manifest,
} from "./mirrorEngine";

/**
 * One-way mirror of the user's Drive workspaces into a folder on disk, using
 * the File System Access API (Chromium desktop only). Drive stays the source
 * of truth; the folder is a readable copy for when the app is unavailable.
 * This module owns the lifecycle (folder handle, permission, triggers); the
 * disk work lives in `mirrorEngine.ts`.
 */

const SYNC_DEBOUNCE_MS = 1500;
const FULL_SYNC_INTERVAL_MS = 5 * 60_000;

let handleStore: UseStore | undefined;
function handles(): UseStore {
  handleStore ??= createStore("nextnotepad-local-mirror", "handles");
  return handleStore;
}

let activeUserId: string | null = null;
let root: FileSystemDirectoryHandle | null = null;
let manifest: Manifest | null = null;
let running: Promise<void> | null = null;
let rerun: { full: boolean } | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let fullSyncTimer: ReturnType<typeof setInterval> | undefined;
let unsubscribers: Array<() => void> = [];
const pendingContent = new Map<string, string>();

const state = () => useLocalMirrorStore.getState();

export function isLocalMirrorSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/** Called once the signed-in user's workspace is ready. */
export async function startLocalMirror(userId: string): Promise<void> {
  if (!isLocalMirrorSupported()) {
    state().set({ status: "unsupported" });
    return;
  }
  if (activeUserId === userId && root) return;
  stopLocalMirror();
  activeUserId = userId;

  const stored = await get<FileSystemDirectoryHandle>(userId, handles());
  if (!stored || activeUserId !== userId) {
    state().set({ status: "off", folderName: null });
    return;
  }
  state().set({ folderName: stored.name });
  const permission = await stored.queryPermission?.({ mode: "readwrite" });
  if (permission !== "granted") {
    state().set({ status: "needs-permission" });
    pendingHandle = stored;
    return;
  }
  await attach(stored);
}

function detachListeners(): void {
  for (const off of unsubscribers) off();
  unsubscribers = [];
  clearTimeout(debounceTimer);
  clearInterval(fullSyncTimer);
}

export function stopLocalMirror(): void {
  detachListeners();
  activeUserId = null;
  root = null;
  manifest = null;
  pendingHandle = null;
  pendingContent.clear();
  state().set({
    status: isLocalMirrorSupported() ? "off" : "unsupported",
    folderName: null,
    lastSyncedAt: null,
    fileCount: 0,
    progress: null,
    failedCount: 0,
    error: null,
  });
}

let pendingHandle: FileSystemDirectoryHandle | null = null;

/** Must be called from a click handler (the picker needs a user gesture). */
export async function chooseLocalMirrorFolder(): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || !window.showDirectoryPicker) return;
  let picked: FileSystemDirectoryHandle;
  try {
    picked = await window.showDirectoryPicker({
      id: "nextnotepad-mirror",
      mode: "readwrite",
      startIn: "documents",
    });
  } catch (err) {
    if ((err as DOMException)?.name === "AbortError") return;
    throw err;
  }
  if ((await picked.requestPermission?.({ mode: "readwrite" })) === "denied") {
    state().set({ status: "needs-permission", folderName: picked.name });
    return;
  }
  stopLocalMirror();
  activeUserId = userId;
  if (await attach(picked)) await set(userId, picked, handles());
}

/** Re-grants access to the remembered folder. Needs a user gesture. */
export async function reconnectLocalMirror(): Promise<void> {
  const handle = pendingHandle;
  if (!handle) return;
  const permission = await handle.requestPermission?.({ mode: "readwrite" });
  if (permission !== "granted") return;
  pendingHandle = null;
  await attach(handle);
}

/** Stops mirroring. Files already on disk are left alone. */
export async function disableLocalMirror(): Promise<void> {
  const userId = activeUserId ?? useAuthStore.getState().user?.id;
  stopLocalMirror();
  if (userId) await del(userId, handles());
}

export function syncLocalMirrorNow(): void {
  if (root) void runSync(true);
}

/** Lets a just-saved note reach disk without re-downloading it from Drive. */
export function notifyLocalMirrorContent(fileId: string, content: string): void {
  if (!root) return;
  pendingContent.set(fileId, content);
  scheduleSync();
}

async function attach(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const userId = activeUserId;
  if (!userId) return false;
  try {
    manifest = await readManifest(handle, userId);
  } catch (err) {
    state().set({ status: "error", folderName: handle.name, error: message(err) });
    return false;
  }
  detachListeners();
  root = handle;
  state().set({
    status: "idle",
    folderName: handle.name,
    fileCount: Object.keys(manifest.files).length,
    error: null,
  });

  unsubscribers.push(
    useWorkspaceStore.subscribe((s, prev) => {
      if (s.nodes !== prev.nodes) scheduleSync();
    }),
    useMultiWorkspaceStore.subscribe((s, prev) => {
      if (s.workspaces !== prev.workspaces) scheduleSync();
    }),
  );
  fullSyncTimer = setInterval(() => void runSync(true), FULL_SYNC_INTERVAL_MS);
  void runSync(true);
  return true;
}

function scheduleSync(): void {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void runSync(false), SYNC_DEBOUNCE_MS);
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

/**
 * Serialised: a request that arrives mid-run is folded into one follow-up run.
 * `full` reloads every workspace tree through the Drive cache; incremental
 * runs only look at trees already in memory, so they cost no network.
 */
function runSync(full: boolean): Promise<void> {
  if (running) {
    rerun = { full: full || Boolean(rerun?.full) };
    return running;
  }
  running = reconcile(full)
    .catch((err) => {
      if (err instanceof PermissionLostError) {
        pendingHandle = root;
        root = null;
        state().set({ status: "needs-permission", progress: null });
      } else {
        state().set({ status: "error", error: message(err), progress: null });
      }
    })
    .finally(() => {
      running = null;
      const next = rerun;
      rerun = null;
      if (next && root) void runSync(next.full);
    });
  return running;
}

async function loadSources(full: boolean): Promise<{
  workspaces: MirrorWorkspace[];
  trees: Record<string, WorkspaceNode[] | undefined>;
}> {
  let workspaces: MirrorWorkspace[] = useMultiWorkspaceStore.getState().workspaces;
  if (workspaces.length === 0) {
    workspaces = (await loadWorkspaceList({ background: true })).workspaces;
  }
  const trees: Record<string, WorkspaceNode[] | undefined> = {};
  await Promise.all(
    workspaces.map(async (ws) => {
      const cached = full ? undefined : getCachedWorkspaceTreeSync(ws.id);
      if (cached) {
        trees[ws.id] = cached.nodes;
        return;
      }
      try {
        trees[ws.id] = (await loadWorkspaceTree(ws.id, { background: true })).nodes;
      } catch {
        // Leave undefined: files of a workspace we couldn't load are kept as-is.
      }
    }),
  );
  return { workspaces, trees };
}

async function reconcile(full: boolean): Promise<void> {
  const dir = root;
  const m = manifest;
  if (!dir || !m) return;

  state().set({ status: "syncing", error: null });
  const { workspaces, trees } = await loadSources(full);
  if (root !== dir) return;

  const { failed } = await reconcileMirror({
    dir,
    manifest: m,
    plan: buildMirrorPlan(workspaces, trees),
    knownWorkspaceIds: new Set(workspaces.map((w) => w.id)),
    loadedWorkspaceIds: new Set(Object.keys(trees).filter((id) => trees[id])),
    full,
    pendingContent,
    readContent: (t) => readDriveFileContent(t.fileId, t.version, { background: true }),
    onProgress: (done, total) =>
      state().set({ progress: total ? { done, total } : null }),
  });

  state().set({
    status: failed > 0 ? "error" : "idle",
    error: failed > 0 ? `${failed} file(s) could not be written` : null,
    failedCount: failed,
    progress: null,
    lastSyncedAt: Date.now(),
    fileCount: Object.keys(m.files).length,
  });
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
