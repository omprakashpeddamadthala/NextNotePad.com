import type { drive_v3 } from "googleapis";

const ROOT_FOLDER_NAME = "NextNotePad.com";
const WORKSPACES_FOLDER_NAME = "Workspaces";
export const APP_CONFIG_FILE_NAME = ".appConfig.json";
export const WORKSPACE_META_FILE_NAME = ".workspace.json";
export const FOLDER_MIME = "application/vnd.google-apps.folder";

const ENTRY_FIELDS =
  "id,name,mimeType,parents,appProperties,description,size,createdTime,modifiedTime,version,trashed";

export interface DriveEntry {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  appProperties: Record<string, string>;
  description: string | null;
  size: number;
  createdTime: number;
  modifiedTime: number;
  version: number;
  trashed: boolean;
}

export class DriveNotFoundError extends Error {
  constructor(id: string) {
    super(`Drive entry ${id} not found`);
    this.name = "DriveNotFoundError";
  }
}

function escapeQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function toEntry(f: drive_v3.Schema$File): DriveEntry {
  return {
    id: f.id ?? "",
    name: f.name ?? "",
    mimeType: f.mimeType ?? "",
    parents: f.parents ?? [],
    appProperties:
      (f.appProperties as Record<string, string> | undefined) ?? {},
    description: f.description ?? null,
    size: Number(f.size ?? 0),
    createdTime: f.createdTime ? Date.parse(f.createdTime) : Date.now(),
    modifiedTime: f.modifiedTime ? Date.parse(f.modifiedTime) : Date.now(),
    version: Number(f.version ?? 1),
    trashed: Boolean(f.trashed),
  };
}

function isNotFound(err: unknown): boolean {
  const e = err as {
    code?: number;
    status?: number;
    response?: { status?: number };
  };
  return e?.code === 404 || e?.status === 404 || e?.response?.status === 404;
}

function isRetryable(err: unknown): boolean {
  const e = err as {
    code?: number | string;
    status?: number;
    response?: { status?: number };
  };
  const status = Number(e?.response?.status ?? e?.status ?? e?.code);
  return (
    status === 429 ||
    status >= 500 ||
    e?.code === "ECONNRESET" ||
    e?.code === "ETIMEDOUT"
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || i === attempts - 1) throw err;
      await new Promise((r) =>
        setTimeout(r, 250 * 2 ** i + Math.random() * 100),
      );
    }
  }
  throw lastErr;
}

interface LayoutIds {
  rootId?: string;
  workspacesId?: string;
}
const layoutCache = new Map<string, LayoutIds>();
const inFlight = new Map<string, Promise<string>>();
const LIST_CACHE_TTL_MS = 3_000;
const listCache = new Map<
  string,
  { entries: DriveEntry[]; expiresAt: number }
>();
const listInFlight = new Map<string, Promise<DriveEntry[]>>();
const listGeneration = new Map<string, number>();

const ENTRY_CACHE_TTL_MS = 15_000;
const ENTRY_CACHE_MAX = 20_000;
const entryCache = new Map<string, { entry: DriveEntry; expiresAt: number }>();
const entryInFlight = new Map<string, Promise<DriveEntry>>();
const entryGeneration = new Map<string, number>();

function rememberEntries(userId: string, entries: DriveEntry[]): void {
  const expiresAt = Date.now() + ENTRY_CACHE_TTL_MS;
  for (const entry of entries) {
    const key = `${userId}:${entry.id}`;
    entryCache.delete(key);
    entryCache.set(key, { entry, expiresAt });
  }
  if (entryCache.size > ENTRY_CACHE_MAX) {
    for (const key of entryCache.keys()) {
      entryCache.delete(key);
      if (entryCache.size <= ENTRY_CACHE_MAX * 0.9) break;
    }
  }
}

function invalidateUserEntries(userId: string): void {
  entryGeneration.set(userId, (entryGeneration.get(userId) ?? 0) + 1);
  const prefix = `${userId}:`;
  for (const key of entryCache.keys()) {
    if (key.startsWith(prefix)) entryCache.delete(key);
  }
  for (const key of entryInFlight.keys()) {
    if (key.startsWith(prefix)) entryInFlight.delete(key);
  }
}

function invalidateUserLists(userId: string): void {
  listGeneration.set(userId, (listGeneration.get(userId) ?? 0) + 1);
  const prefix = `${userId}:`;
  for (const key of listCache.keys()) {
    if (key.startsWith(prefix)) listCache.delete(key);
  }
  for (const key of listInFlight.keys()) {
    if (key.startsWith(prefix)) listInFlight.delete(key);
  }
}

function dedupe(key: string, fn: () => Promise<string>): Promise<string> {
  const existing = inFlight.get(key);
  if (existing) return existing;
  const p = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

export class DriveService {
  constructor(
    readonly drive: drive_v3.Drive,
    readonly userId: string,
  ) {}

  private get layout(): LayoutIds {
    let l = layoutCache.get(this.userId);
    if (!l) {
      l = {};
      layoutCache.set(this.userId, l);
    }
    return l;
  }

  static clearCache(userId?: string) {
    if (userId) {
      layoutCache.delete(userId);
      invalidateUserLists(userId);
      invalidateUserEntries(userId);
    } else {
      layoutCache.clear();
      listCache.clear();
      listInFlight.clear();
      listGeneration.clear();
      entryCache.clear();
      entryInFlight.clear();
      entryGeneration.clear();
    }
  }

  async list(q: string, pageSize = 1000): Promise<DriveEntry[]> {
    const key = `${this.userId}:${pageSize}:${q}`;
    const cached = listCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.entries;
    const pending = listInFlight.get(key);
    if (pending) return pending;

    const generation = listGeneration.get(this.userId) ?? 0;
    const request = (async () => {
      const out: DriveEntry[] = [];
      let pageToken: string | undefined;
      do {
        const res = await withRetry(() =>
          this.drive.files.list({
            q,
            pageSize,
            pageToken,
            spaces: "drive",
            fields: `nextPageToken, files(${ENTRY_FIELDS})`,
          }),
        );
        for (const f of res.data.files ?? []) out.push(toEntry(f));
        pageToken = res.data.nextPageToken ?? undefined;
      } while (pageToken);
      if ((listGeneration.get(this.userId) ?? 0) === generation) {
        rememberEntries(this.userId, out);
        listCache.set(key, {
          entries: out,
          expiresAt: Date.now() + LIST_CACHE_TTL_MS,
        });
      }
      return out;
    })().finally(() => {
      if (listInFlight.get(key) === request) listInFlight.delete(key);
    });
    listInFlight.set(key, request);
    return request;
  }

  async findChild(
    parentId: string,
    name: string,
    opts: { folder?: boolean } = {},
  ): Promise<DriveEntry | null> {
    const mime =
      opts.folder === undefined
        ? ""
        : opts.folder
          ? ` and mimeType = '${FOLDER_MIME}'`
          : ` and mimeType != '${FOLDER_MIME}'`;
    const found = await this.list(
      `name = '${escapeQuery(name)}' and '${parentId}' in parents and trashed = false${mime}`,
      10,
    );
    return found[0] ?? null;
  }

  async listChildren(parentId: string): Promise<DriveEntry[]> {
    return this.list(`'${parentId}' in parents and trashed = false`);
  }

  async hasTrashedChildren(parentId: string): Promise<boolean> {
    const res = await withRetry(() =>
      this.drive.files.list({
        q: `'${parentId}' in parents and trashed = true`,
        pageSize: 1,
        fields: "files(id)",
      }),
    );
    return (res.data.files ?? []).length > 0;
  }

  async listAllAppEntries(): Promise<DriveEntry[]> {
    return this.list("trashed = false");
  }

  async get(id: string, opts: { fresh?: boolean } = {}): Promise<DriveEntry> {
    const key = `${this.userId}:${id}`;
    if (!opts.fresh) {
      const hit = entryCache.get(key);
      if (hit && hit.expiresAt > Date.now()) return hit.entry;
      const pending = entryInFlight.get(key);
      if (pending) return pending;
    }
    const generation = entryGeneration.get(this.userId) ?? 0;
    const request = (async () => {
      try {
        const res = await withRetry(() =>
          this.drive.files.get({ fileId: id, fields: ENTRY_FIELDS }),
        );
        const entry = toEntry(res.data);
        if ((entryGeneration.get(this.userId) ?? 0) === generation)
          rememberEntries(this.userId, [entry]);
        return entry;
      } catch (err) {
        if (isNotFound(err)) throw new DriveNotFoundError(id);
        throw err;
      }
    })().finally(() => {
      if (entryInFlight.get(key) === request) entryInFlight.delete(key);
    });
    entryInFlight.set(key, request);
    return request;
  }

  async readText(id: string): Promise<string> {
    try {
      const res = await withRetry(() =>
        this.drive.files.get(
          { fileId: id, alt: "media" },
          { responseType: "text" },
        ),
      );
      return typeof res.data === "string"
        ? res.data
        : res.data == null
          ? ""
          : JSON.stringify(res.data);
    } catch (err) {
      if (isNotFound(err)) throw new DriveNotFoundError(id);
      throw err;
    }
  }

  async createFolder(
    name: string,
    parentId: string,
    appProperties?: Record<string, string>,
    description?: string,
  ): Promise<DriveEntry> {
    const res = await withRetry(() =>
      this.drive.files.create({
        requestBody: {
          name,
          mimeType: FOLDER_MIME,
          parents: [parentId],
          appProperties,
          description,
        },
        fields: ENTRY_FIELDS,
      }),
    );
    invalidateUserLists(this.userId);
    const entry = toEntry(res.data);
    rememberEntries(this.userId, [entry]);
    return entry;
  }

  async createFile(
    name: string,
    parentId: string,
    content: string,
    opts: { mimeType?: string; appProperties?: Record<string, string> } = {},
  ): Promise<DriveEntry> {
    const mimeType = opts.mimeType ?? "text/plain";
    const res = await withRetry(() =>
      this.drive.files.create({
        requestBody: {
          name,
          parents: [parentId],
          mimeType,
          appProperties: opts.appProperties,
        },
        media: { mimeType, body: content },
        fields: ENTRY_FIELDS,
      }),
    );
    invalidateUserLists(this.userId);
    const entry = toEntry(res.data);
    rememberEntries(this.userId, [entry]);
    return entry;
  }

  async update(
    id: string,
    patch: {
      name?: string;
      description?: string | null;
      appProperties?: Record<string, string | null>;
      moveTo?: { parentId: string; fromParentId?: string };
      content?: string;
      mimeType?: string;
    },
  ): Promise<DriveEntry> {
    let addParents: string | undefined;
    let removeParents: string | undefined;
    if (patch.moveTo) {
      const from =
        patch.moveTo.fromParentId ?? (await this.get(id)).parents.join(",");
      if (from !== patch.moveTo.parentId) {
        addParents = patch.moveTo.parentId;
        removeParents = from || undefined;
      }
    }
    const requestBody: drive_v3.Schema$File = {};
    if (patch.name !== undefined) requestBody.name = patch.name;
    if (patch.description !== undefined)
      requestBody.description = patch.description;
    if (patch.appProperties)
      requestBody.appProperties = patch.appProperties as Record<string, string>;
    try {
      const res = await withRetry(() =>
        this.drive.files.update({
          fileId: id,
          addParents,
          removeParents,
          requestBody,
          ...(patch.content !== undefined
            ? {
                media: {
                  mimeType: patch.mimeType ?? "text/plain",
                  body: patch.content,
                },
              }
            : {}),
          fields: ENTRY_FIELDS,
        }),
      );
      invalidateUserLists(this.userId);
      const entry = toEntry(res.data);
      rememberEntries(this.userId, [entry]);
      return entry;
    } catch (err) {
      if (isNotFound(err)) throw new DriveNotFoundError(id);
      throw err;
    }
  }

  async trash(id: string): Promise<void> {
    try {
      await withRetry(() =>
        this.drive.files.update({
          fileId: id,
          requestBody: { trashed: true },
          fields: "id",
        }),
      );
      invalidateUserLists(this.userId);
      invalidateUserEntries(this.userId);
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
  }

  private async ensureFolder(
    cacheKey: keyof LayoutIds,
    name: string,
    parentId: string,
  ): Promise<string> {
    const cached = this.layout[cacheKey];
    if (cached) return cached;
    return dedupe(`${this.userId}:${cacheKey}`, async () => {
      const existing = await this.findChild(parentId, name, { folder: true });
      const id =
        existing?.id ??
        (await this.createFolder(name, parentId, { nnp_kind: cacheKey })).id;
      this.layout[cacheKey] = id;
      return id;
    });
  }

  ensureRootFolder(): Promise<string> {
    return this.ensureFolder("rootId", ROOT_FOLDER_NAME, "root");
  }

  async ensureWorkspacesFolder(): Promise<string> {
    return this.ensureFolder(
      "workspacesId",
      WORKSPACES_FOLDER_NAME,
      await this.ensureRootFolder(),
    );
  }

  invalidateLayout() {
    layoutCache.delete(this.userId);
    invalidateUserEntries(this.userId);
  }
}
