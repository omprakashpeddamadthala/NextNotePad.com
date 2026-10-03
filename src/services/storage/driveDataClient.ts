import { createStore, del, get, set, type UseStore } from "idb-keyval";
import { fetchJson } from "@/lib/api/fetchJson";
import {
  incrementDriveMetric,
  measureDriveTiming,
} from "@/lib/performance/driveMetrics";
import type { WorkspaceNode } from "@/types/file";

export interface CachedWorkspaceRecord {
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
const generations = new Map<string, number>();
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
  const next = request().finally(() => {
    if (inFlight.get(key) === next) inFlight.delete(key);
  });
  inFlight.set(key, next);
  return next;
}

function generation(key: string): number {
  return generations.get(key) ?? 0;
}

function invalidateKey(key: string): void {
  generations.set(key, generation(key) + 1);
  inFlight.delete(key);
}

async function cachedRequest<T>({
  key,
  policy,
  force = false,
  request,
  onFresh,
}: {
  key: string;
  policy: ResourcePolicy;
  force?: boolean;
  background?: boolean;
  request: () => Promise<T>;
  onFresh?: (value: T) => void;
}): Promise<T> {
  const cached = await readRecord<T>(key);
  if (!force && cached && age(cached) <= policy.freshMs) {
    incrementDriveMetric("cacheHit");
    return cached.value;
  }

  if (!force && cached && age(cached) <= policy.staleMs) {
    incrementDriveMetric("cacheStaleHit");
    const requestGeneration = generation(key);
    void dedupe(key, async () => {
      try {
        incrementDriveMetric("apiRequest");
        const value = await request();
        if (generation(key) === requestGeneration) {
          await writeRecord(key, value);
          onFresh?.(value);
        }
        return value;
      } catch {
        return cached.value;
      }
    });
    return cached.value;
  }

  incrementDriveMetric("cacheMiss");
  const requestGeneration = generation(key);
  try {
    return await dedupe(key, async () => {
      incrementDriveMetric("apiRequest");
      const value = await request();
      if (generation(key) === requestGeneration) {
        await writeRecord(key, value);
        onFresh?.(value);
      }
      return value;
    });
  } catch (error) {
    if (!force && cached) return cached.value;
    throw error;
  }
}

export function configureDriveDataClient(userId: string): void {
  if (activeUserId === userId) return;
  activeUserId = userId;
  fileWorkspaceIds.clear();
}

export function currentDriveCacheUserId(): string | null {
  return activeUserId;
}

export async function getCachedWorkspaceList(): Promise<
  WorkspaceListResponse | undefined
> {
  if (!activeUserId) return undefined;
  return (await readRecord<WorkspaceListResponse>(userKey("workspaces")))
    ?.value;
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
      request: () =>
        fetchJson<WorkspaceListResponse>("/api/workspaces", {
          action: "Load workspaces",
          background: options.background,
        }),
    }),
  );
}

export async function getCachedWorkspaceTree(
  workspaceId: string,
): Promise<WorkspaceTreeResponse | undefined> {
  if (!activeUserId) return undefined;
  const cached = (
    await readRecord<WorkspaceTreeResponse>(userKey(`tree:${workspaceId}`))
  )?.value;
  if (cached) rememberTree(cached);
  return cached;
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
      request: () =>
        fetchJson<WorkspaceTreeResponse>(`/api/workspace?${params}`, {
          action: "Load workspace",
          background: options.background,
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

export async function cacheWorkspaceTree(
  tree: WorkspaceTreeResponse,
): Promise<void> {
  rememberTree(tree);
  await writeRecord(userKey(`tree:${tree.workspaceId}`), tree);
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
      request: () =>
        fetchJson<{ files: SearchableDriveFile[] }>("/api/files", {
          action: "Search all workspaces",
          background: options.background,
        }),
      onFresh: (value) => options.onFresh?.(value.files),
    });
    for (const file of data.files) {
      if (file.workspaceId) fileWorkspaceIds.set(file.id, file.workspaceId);
    }
    return data.files;
  });
}

export async function readCachedFileContent(
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
  const requestGeneration = generation(key);
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
          background: options.background,
        },
      );
      if (generation(key) === requestGeneration) {
        await writeRecord(key, data.content ?? "", version);
      }
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

export async function invalidateFileContent(fileId: string): Promise<void> {
  if (!activeUserId) return;
  const key = userKey(`content:${fileId}`);
  invalidateKey(key);
  await deleteRecord(key);
}

export async function invalidateWorkspaceTree(
  workspaceId: string,
): Promise<void> {
  if (!activeUserId) return;
  const key = userKey(`tree:${workspaceId}`);
  invalidateKey(key);
  await deleteRecord(key);
}

export async function invalidateWorkspaceList(): Promise<void> {
  if (!activeUserId) return;
  const key = userKey("workspaces");
  invalidateKey(key);
  await deleteRecord(key);
}

export async function invalidateDriveFileIndex(): Promise<void> {
  if (!activeUserId) return;
  const key = userKey("files");
  invalidateKey(key);
  await deleteRecord(key);
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
): Promise<void> {
  const eligible = files
    .filter((file) => (file.size ?? 0) <= 256 * 1024)
    .slice(0, 12);
  incrementDriveMetric("prefetchStarted");
  try {
    await mapConcurrent(eligible, 3, async (file) => {
      await readDriveFileContent(file.id, file.version, { background: true });
    });
    incrementDriveMetric("prefetchCompleted");
  } catch {
    incrementDriveMetric("prefetchFailed");
  }
}
