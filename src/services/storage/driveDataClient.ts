import { createStore, del, entries, get, set, type UseStore } from "idb-keyval";
import { fetchJson } from "@/lib/api/fetchJson";
import {
  incrementDriveMetric,
  measureDriveTiming,
} from "@/lib/performance/driveMetrics";
import type { WorkspaceNode } from "@/types/file";

interface CachedWorkspaceRecord {
  id: string;
  name: string;
  description: string | null;
  driveWorkspaceFolderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceListResponse {
  workspaces: CachedWorkspaceRecord[];
  activeWorkspaceId: string | null;
}

export interface WorkspaceTreeResponse {
  nodes: WorkspaceNode[];
  hasAnyHistory: boolean;
  workspaceId: string;
}

export interface AllWorkspaceTreesResponse {
  workspaces: CachedWorkspaceRecord[];
  activeWorkspaceId: string | null;
  trees: Record<string, WorkspaceTreeResponse>;
}

export interface SearchableDriveFile {
  id: string;
  name: string;
  path: string;
  size?: number;
  version?: number;
  workspaceId?: string;
  workspaceName?: string;
  updatedAt?: string;
}

interface CacheRecord<T> {
  value: T;
  storedAt: number;
  version?: number;
}

interface ResourcePolicy {
  freshMs: number;
  staleMs: number;
}

const POLICIES = {
  workspaces: { freshMs: 30_000, staleMs: 24 * 60 * 60_000 },
  tree: { freshMs: 20_000, staleMs: 24 * 60 * 60_000 },
  files: { freshMs: 60_000, staleMs: 24 * 60 * 60_000 },
  content: { freshMs: 5 * 60_000, staleMs: 7 * 24 * 60 * 60_000 },
} satisfies Record<string, ResourcePolicy>;

const memory = new Map<string, CacheRecord<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
const fileWorkspaceIds = new Map<string, string>();
let cacheStore: UseStore | undefined;
let activeUserId: string | null = null;

function store(): UseStore | undefined {
  if (typeof window === "undefined") return undefined;
  cacheStore ??= createStore("nextnotepad-drive-cache", "resources");
  return cacheStore;
}

function userKey(resource: string): string {
  if (!activeUserId) throw new Error("Drive data client is not configured");
  return `${activeUserId}:${resource}`;
}

function rememberTree(tree: WorkspaceTreeResponse): void {
  for (const node of tree.nodes) {
    if (node.type === "file") fileWorkspaceIds.set(node.id, tree.workspaceId);
  }
}

async function readRecord<T>(key: string): Promise<CacheRecord<T> | undefined> {
  const hit = memory.get(key) as CacheRecord<T> | undefined;
  if (hit) return hit;
  const db = store();
  if (!db) return undefined;
  const persisted = await get<CacheRecord<T>>(key, db);
  if (persisted) memory.set(key, persisted);
  return persisted;
}

async function writeRecord<T>(
  key: string,
  value: T,
  version?: number,
): Promise<void> {
  const record: CacheRecord<T> = { value, storedAt: Date.now(), version };
  memory.set(key, record);
  const db = store();
  if (db) await set(key, record, db);
}

async function deleteRecord(key: string): Promise<void> {
  memory.delete(key);
  const db = store();
  if (db) await del(key, db);
}

function age(record: CacheRecord<unknown>): number {
  return Date.now() - record.storedAt;
}

function dedupe<T>(key: string, request: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) {
    incrementDriveMetric("deduplicatedRequest");
    return existing;
  }
  const next = request().finally(() => inFlight.delete(key));
  inFlight.set(key, next);
  return next;
}

async function cachedRequest<T>({
  key,
  policy,
  force = false,
  background = false,
  request,
  onFresh,
}: {
  key: string;
  policy: ResourcePolicy;
  force?: boolean;
  background?: boolean;
  request: (isBackground?: boolean) => Promise<T>;
  onFresh?: (value: T) => void;
}): Promise<T> {
  const cached = await readRecord<T>(key);
  if (!force && cached && age(cached) <= policy.freshMs) {
    incrementDriveMetric("cacheHit");
    return cached.value;
  }

  if (!force && cached && age(cached) <= policy.staleMs) {
    incrementDriveMetric("cacheStaleHit");
    void dedupe(key, async () => {
      try {
        incrementDriveMetric("apiRequest");
        const value = await request(true);
        await writeRecord(key, value);
        onFresh?.(value);
        return value;
      } catch {
        return cached.value;
      }
    });
    return cached.value;
  }

  incrementDriveMetric("cacheMiss");
  try {
    return await dedupe(key, async () => {
      incrementDriveMetric("apiRequest");
      const value = await request(background);
      await writeRecord(key, value);
      onFresh?.(value);
      return value;
    });
  } catch (error) {
    if (cached) return cached.value;
    throw error;
  }
}

export function configureDriveDataClient(userId: string): void {
  if (activeUserId === userId) return;
  activeUserId = userId;
  fileWorkspaceIds.clear();
}

export async function warmDriveCacheFromIndexedDB(userId: string): Promise<void> {
  const db = store();
  if (!db) return;
  try {
    const all = await entries<string, CacheRecord<unknown>>(db);
    const prefix = `${userId}:`;
    for (const [k, v] of all) {
      if (
        typeof k === "string" &&
        k.startsWith(prefix) &&
        v &&
        typeof v === "object" &&
        "value" in v
      ) {
        memory.set(k, v);
        if (k.startsWith(`${prefix}tree:`)) {
          const tree = v.value as WorkspaceTreeResponse;
          if (tree?.nodes) {
            rememberTree(tree);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Failed to warm drive cache from IndexedDB:", err);
  }
}

export function getCachedWorkspaceListSync(): WorkspaceListResponse | undefined {
  if (!activeUserId) return undefined;
  return (
    memory.get(userKey("workspaces")) as
      | CacheRecord<WorkspaceListResponse>
      | undefined
  )?.value;
}

export function getCachedWorkspaceTreeSync(
  workspaceId: string,
): WorkspaceTreeResponse | undefined {
  if (!activeUserId) return undefined;
  const record = memory.get(userKey(`tree:${workspaceId}`)) as
    | CacheRecord<WorkspaceTreeResponse>
    | undefined;
  if (record) {
    rememberTree(record.value);
    return record.value;
  }
  return undefined;
}

export function getCachedDriveFileIndexSync(): SearchableDriveFile[] | undefined {
  if (!activeUserId) return undefined;
  return (
    memory.get(userKey("files")) as
      | CacheRecord<{ files: SearchableDriveFile[] }>
      | undefined
  )?.value?.files;
}

export function hasCachedWorkspaceTreeSync(workspaceId: string): boolean {
  if (!activeUserId) return false;
  return memory.has(userKey(`tree:${workspaceId}`));
}

export async function cacheWorkspaceList(
  value: WorkspaceListResponse,
): Promise<void> {
  await writeRecord(userKey("workspaces"), value);
}

export function loadWorkspaceList(
  options: {
    force?: boolean;
    background?: boolean;
    onFresh?: (value: WorkspaceListResponse) => void;
  } = {},
): Promise<WorkspaceListResponse> {
  return measureDriveTiming("workspace-list", () =>
    cachedRequest({
      key: userKey("workspaces"),
      policy: POLICIES.workspaces,
      ...options,
      request: (isBg) =>
        fetchJson<WorkspaceListResponse>("/api/workspaces", {
          action: "Load workspaces",
          background: isBg || options.background,
        }),
    }),
  );
}

export function loadWorkspaceTree(
  workspaceId: string,
  options: {
    force?: boolean;
    background?: boolean;
    onFresh?: (value: WorkspaceTreeResponse) => void;
  } = {},
): Promise<WorkspaceTreeResponse> {
  const params = new URLSearchParams({ workspaceId });
  return measureDriveTiming("workspace-tree", async () => {
    const value = await cachedRequest({
      key: userKey(`tree:${workspaceId}`),
      policy: POLICIES.tree,
      ...options,
      request: (isBg) =>
        fetchJson<WorkspaceTreeResponse>(`/api/workspace?${params}`, {
          action: "Load workspace",
          background: isBg || options.background,
        }),
      onFresh: (tree) => {
        rememberTree(tree);
        options.onFresh?.(tree);
      },
    });
    rememberTree(value);
    return value;
  });
}

export function loadActiveWorkspaceTree(
  options: {
    background?: boolean;
  } = {},
): Promise<WorkspaceTreeResponse> {
  return measureDriveTiming("workspace-tree", async () => {
    incrementDriveMetric("apiRequest");
    const tree = await fetchJson<WorkspaceTreeResponse>("/api/workspace", {
      action: "Load workspace",
      background: options.background,
    });
    rememberTree(tree);
    await writeRecord(userKey(`tree:${tree.workspaceId}`), tree);
    return tree;
  });
}

export function loadAllWorkspaceTrees(
  options: {
    force?: boolean;
    background?: boolean;
    onFresh?: (data: AllWorkspaceTreesResponse) => void;
  } = {},
): Promise<AllWorkspaceTreesResponse> {
  return measureDriveTiming("all-workspace-trees", async () => {
    const handleData = async (data: AllWorkspaceTreesResponse) => {
      await writeRecord(userKey("workspaces"), {
        workspaces: data.workspaces,
        activeWorkspaceId: data.activeWorkspaceId,
      });

      const allFiles: SearchableDriveFile[] = [];
      const wsMap = new Map(data.workspaces.map((w) => [w.id, w.name]));

      for (const [wsId, tree] of Object.entries(data.trees)) {
        rememberTree(tree);
        await writeRecord(userKey(`tree:${wsId}`), tree);

        const wsName = wsMap.get(wsId) ?? "Workspace";
        for (const node of tree.nodes) {
          if (node.type === "file" && !node.deleted) {
            allFiles.push({
              id: node.id,
              name: node.name,
              path: node.path,
              size: node.size,
              version: node.version,
              workspaceId: wsId,
              workspaceName: wsName,
              updatedAt: new Date(node.updatedAt).toISOString(),
            });
          }
        }
      }

      await writeRecord(userKey("files"), { files: allFiles });
    };

    const res = await cachedRequest({
      key: userKey("all-trees"),
      policy: POLICIES.tree,
      ...options,
      request: (isBg) =>
        fetchJson<AllWorkspaceTreesResponse>("/api/workspaces/trees", {
          action: "Load all workspaces",
          background: isBg ?? options.background ?? true,
        }),
      onFresh: async (fresh) => {
        await handleData(fresh);
        options.onFresh?.(fresh);
      },
    });

    await handleData(res);
    return res;
  });
}

export function loadDriveFileIndex(
  options: {
    force?: boolean;
    background?: boolean;
    onFresh?: (files: SearchableDriveFile[]) => void;
  } = {},
): Promise<SearchableDriveFile[]> {
  return measureDriveTiming("file-index", async () => {
    const data = await cachedRequest({
      key: userKey("files"),
      policy: POLICIES.files,
      ...options,
      request: (isBg) =>
        fetchJson<{ files: SearchableDriveFile[] }>("/api/files", {
          action: "Search all workspaces",
          background: isBg || options.background,
        }),
      onFresh: (value) => options.onFresh?.(value.files),
    });
    for (const file of data.files) {
      if (file.workspaceId) fileWorkspaceIds.set(file.id, file.workspaceId);
    }
    return data.files;
  });
}

async function readCachedFileContent(
  fileId: string,
  version?: number,
): Promise<string | undefined> {
  if (!activeUserId) return undefined;
  const record = await readRecord<string>(userKey(`content:${fileId}`));
  if (!record || (version !== undefined && record.version !== version))
    return undefined;
  return record.value;
}

export async function readDriveFileContent(
  fileId: string,
  version?: number,
  options: { force?: boolean; background?: boolean } = {},
): Promise<string> {
  const key = userKey(`content:${fileId}`);
  const cached = await readRecord<string>(key);
  if (
    !options.force &&
    cached &&
    (version === undefined || cached.version === version) &&
    age(cached) <= POLICIES.content.staleMs
  ) {
    incrementDriveMetric(
      age(cached) <= POLICIES.content.freshMs ? "cacheHit" : "cacheStaleHit",
    );
    return cached.value;
  }

  incrementDriveMetric("cacheMiss");
  return measureDriveTiming("file-content", () =>
    dedupe(key, async () => {
      incrementDriveMetric("apiRequest");
      const workspaceId = fileWorkspaceIds.get(fileId);
      const params = workspaceId
        ? `?${new URLSearchParams({ workspaceId })}`
        : "";
      const data = await fetchJson<{ content: string }>(
        `/api/files/${fileId}${params}`,
        {
          action: "Load file",
          background: options.background ?? true,
        },
      );
      await writeRecord(key, data.content ?? "", version);
      return data.content ?? "";
    }),
  );
}

export async function writeCachedFileContent(
  fileId: string,
  content: string,
  version?: number,
): Promise<void> {
  await writeRecord(userKey(`content:${fileId}`), content, version);
}

export async function updateCachedTreeNode(
  workspaceId: string,
  node: WorkspaceNode,
): Promise<void> {
  if (!activeUserId) return;
  const key = userKey(`tree:${workspaceId}`);
  const cached = await readRecord<WorkspaceTreeResponse>(key);
  if (cached) {
    const idx = cached.value.nodes.findIndex((n) => n.id === node.id);
    let nextNodes: WorkspaceNode[];
    if (idx >= 0) {
      nextNodes = [...cached.value.nodes];
      nextNodes[idx] = node;
    } else {
      nextNodes = [...cached.value.nodes, node];
    }
    const updatedTree: WorkspaceTreeResponse = {
      ...cached.value,
      nodes: nextNodes,
      hasAnyHistory: true,
    };
    rememberTree(updatedTree);
    await writeRecord(key, updatedTree);
  }

  if (node.type === "file") {
    fileWorkspaceIds.set(node.id, workspaceId);
    const filesKey = userKey("files");
    const cachedFiles = await readRecord<{ files: SearchableDriveFile[] }>(
      filesKey,
    );
    if (cachedFiles) {
      const idx = cachedFiles.value.files.findIndex((f) => f.id === node.id);
      const wsList = getCachedWorkspaceListSync()?.workspaces;
      const wsName =
        wsList?.find((w) => w.id === workspaceId)?.name ?? "Workspace";
      const fileEntry: SearchableDriveFile = {
        id: node.id,
        name: node.name,
        path: node.path,
        size: node.size,
        version: node.version,
        workspaceId,
        workspaceName: wsName,
        updatedAt: new Date(node.updatedAt).toISOString(),
      };
      let nextFiles: SearchableDriveFile[];
      if (idx >= 0) {
        nextFiles = [...cachedFiles.value.files];
        nextFiles[idx] = fileEntry;
      } else {
        nextFiles = [...cachedFiles.value.files, fileEntry];
      }
      await writeRecord(filesKey, { files: nextFiles });
    }
  }
}

export async function removeCachedTreeNode(
  workspaceId: string,
  nodeId: string,
): Promise<void> {
  if (!activeUserId) return;
  const key = userKey(`tree:${workspaceId}`);
  const cached = await readRecord<WorkspaceTreeResponse>(key);
  if (cached) {
    const updatedTree: WorkspaceTreeResponse = {
      ...cached.value,
      nodes: cached.value.nodes.filter((n) => n.id !== nodeId),
    };
    await writeRecord(key, updatedTree);
  }

  const filesKey = userKey("files");
  const cachedFiles = await readRecord<{ files: SearchableDriveFile[] }>(
    filesKey,
  );
  if (cachedFiles) {
    await writeRecord(filesKey, {
      files: cachedFiles.value.files.filter((f) => f.id !== nodeId),
    });
  }
}

export async function invalidateFileContent(fileId: string): Promise<void> {
  if (!activeUserId) return;
  await deleteRecord(userKey(`content:${fileId}`));
}

export async function invalidateWorkspaceTree(
  workspaceId: string,
): Promise<void> {
  if (!activeUserId) return;
  await deleteRecord(userKey(`tree:${workspaceId}`));
}

export async function invalidateDriveFileIndex(): Promise<void> {
  if (!activeUserId) return;
  await deleteRecord(userKey("files"));
}

async function mapConcurrent<T>(
  values: T[],
  concurrency: number,
  fn: (value: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (next < values.length) {
        const value = values[next++];
        await fn(value);
      }
    }),
  );
}

export async function prefetchFileContents(
  files: Array<{ id: string; version?: number; size?: number }>,
  options: { limit?: number; concurrency?: number } = {},
): Promise<void> {
  const limit = options.limit ?? 12;
  const concurrency = options.concurrency ?? 3;
  const eligible = files
    .filter((file) => (file.size ?? 0) <= 1024 * 1024)
    .slice(0, limit);
  if (eligible.length === 0) return;
  incrementDriveMetric("prefetchStarted");
  try {
    await mapConcurrent(eligible, concurrency, async (file) => {
      const cached = await readCachedFileContent(file.id, file.version);
      if (cached !== undefined) return;
      await readDriveFileContent(file.id, file.version, { background: true });
    });
    incrementDriveMetric("prefetchCompleted");
  } catch {
    incrementDriveMetric("prefetchFailed");
  }
}

let prefetchScheduled = false;

export function triggerIdleDrivePrefetch(): void {
  if (prefetchScheduled || typeof window === "undefined" || !activeUserId)
    return;
  prefetchScheduled = true;

  const run = async () => {
    prefetchScheduled = false;
    try {
      await loadAllWorkspaceTrees({ background: true });

      const currentList = getCachedWorkspaceListSync();
      const activeWsId =
        currentList?.activeWorkspaceId ?? currentList?.workspaces[0]?.id;
      if (activeWsId) {
        const activeTree = getCachedWorkspaceTreeSync(activeWsId);
        if (activeTree) {
          const files = activeTree.nodes
            .filter(
              (n): n is Extract<WorkspaceNode, { type: "file" }> =>
                n.type === "file" && !n.deleted && (n.size ?? 0) <= 1024 * 1024,
            );
          void prefetchFileContents(files, { limit: 100, concurrency: 5 });
        }
      }
    } catch {
    }
  };

  if ("requestIdleCallback" in window) {
    (
      window as unknown as {
        requestIdleCallback: (
          cb: () => void,
          opts?: { timeout: number },
        ) => void;
      }
    ).requestIdleCallback(() => void run(), { timeout: 3000 });
  } else {
    setTimeout(() => void run(), 1200);
  }
}
