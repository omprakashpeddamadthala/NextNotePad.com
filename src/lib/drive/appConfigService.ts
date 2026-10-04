import { z } from "zod";
import {
  APP_CONFIG_FILE_NAME,
  DriveNotFoundError,
  type DriveService,
} from "./driveService";

const APP_CONFIG_SCHEMA_VERSION = 1;

const recentEntrySchema = z.object({
  fileId: z.string(),
  openedAt: z.number(),
});

const appConfigSchema = z
  .object({
    schemaVersion: z.number().int(),
    app: z.literal("NextNotePad.com").default("NextNotePad.com"),
    createdAt: z.string(),
    updatedAt: z.string(),
    revision: z.number().int().nonnegative().default(0),
    activeWorkspaceId: z.string().nullable().default(null),
    settings: z
      .object({
        theme: z.string().nullable().default(null),
        editor: z.record(z.string(), z.unknown()).nullable().default(null),
      })
      .passthrough()
      .default({ theme: null, editor: null }),
    recentFiles: z.array(recentEntrySchema).max(100).default([]),
    favorites: z.array(z.string()).max(1000).default([]),
    migrations: z
      .object({
        legacyDatabase: z
          .object({
            completedAt: z.string(),
            workspaces: z.number(),
            folders: z.number(),
            files: z.number(),
          })
          .optional(),
      })
      .passthrough()
      .default({}),
  })
  .passthrough();

export type AppConfig = z.infer<typeof appConfigSchema>;

function defaultAppConfig(now = new Date()): AppConfig {
  const iso = now.toISOString();
  return appConfigSchema.parse({
    schemaVersion: APP_CONFIG_SCHEMA_VERSION,
    createdAt: iso,
    updatedAt: iso,
  });
}

const MIGRATIONS: Record<
  number,
  (raw: Record<string, unknown>) => Record<string, unknown>
> = {};

function migrateAppConfig(raw: unknown): AppConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("appConfig is not an object");
  let current = { ...(raw as Record<string, unknown>) };
  let version =
    typeof current.schemaVersion === "number" ? current.schemaVersion : 0;
  if (version === 0) {
    const now = new Date().toISOString();
    current = { createdAt: now, updatedAt: now, ...current, schemaVersion: 1 };
    version = 1;
  }
  while (version < APP_CONFIG_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`No appConfig migration from v${version}`);
    current = { ...step(current), schemaVersion: version + 1 };
    version += 1;
  }
  return appConfigSchema.parse(current);
}

export type AppConfigPatch = (config: AppConfig) => AppConfig | void;

interface CacheEntry {
  fileId: string;
  config: AppConfig;
  fetchedAt: number;
}

const CACHE_TTL_MS = 15_000;
const cache = new Map<string, CacheEntry>();
const locks = new Map<string, Promise<unknown>>();

function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(userId) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  locks.set(
    userId,
    next.finally(() => {
      if (locks.get(userId) === next) locks.delete(userId);
    }),
  );
  return next;
}

export class AppConfigService {
  constructor(private readonly ds: DriveService) {}

  static clearCache(userId?: string) {
    if (userId) cache.delete(userId);
    else cache.clear();
  }

  private async readFresh(): Promise<CacheEntry> {
    const rootId = await this.ds.ensureRootFolder();
    const existing = await this.ds.findChild(rootId, APP_CONFIG_FILE_NAME, {
      folder: false,
    });
    if (!existing) {
      const config = defaultAppConfig();
      const created = await this.ds.createFile(
        APP_CONFIG_FILE_NAME,
        rootId,
        JSON.stringify(config, null, 2),
        {
          mimeType: "application/json",
          appProperties: { nnp_kind: "appConfig" },
        },
      );
      return { fileId: created.id, config, fetchedAt: Date.now() };
    }

    const text = await this.ds.readText(existing.id);
    let config: AppConfig;
    let needsWrite = false;
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      config = migrateAppConfig(parsed);
      needsWrite = parsed.schemaVersion !== config.schemaVersion;
    } catch (err) {
      console.error(
        `Corrupted ${APP_CONFIG_FILE_NAME} for user ${this.ds.userId}; backing it up:`,
        err,
      );
      await this.ds.update(existing.id, {
        name: `.appConfig.corrupted-${Date.now()}.json`,
      });
      config = defaultAppConfig();
      const created = await this.ds.createFile(
        APP_CONFIG_FILE_NAME,
        rootId,
        JSON.stringify(config, null, 2),
        {
          mimeType: "application/json",
          appProperties: { nnp_kind: "appConfig" },
        },
      );
      return { fileId: created.id, config, fetchedAt: Date.now() };
    }

    const entry = { fileId: existing.id, config, fetchedAt: Date.now() };
    if (needsWrite) await this.write(entry, config);
    return entry;
  }

  private async write(
    entry: CacheEntry,
    config: AppConfig,
  ): Promise<CacheEntry> {
    try {
      await this.ds.update(entry.fileId, {
        content: JSON.stringify(config, null, 2),
        mimeType: "application/json",
      });
    } catch (err) {
      if (err instanceof DriveNotFoundError) {
        cache.delete(this.ds.userId);
        this.ds.invalidateLayout();
      }
      throw err;
    }
    const next = { fileId: entry.fileId, config, fetchedAt: Date.now() };
    cache.set(this.ds.userId, next);
    return next;
  }

  async load(opts: { fresh?: boolean } = {}): Promise<AppConfig> {
    const hit = cache.get(this.ds.userId);
    if (!opts.fresh && hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS)
      return hit.config;
    const requestedAt = Date.now();
    const entry = await withUserLock(this.ds.userId, async () => {
      const settled = cache.get(this.ds.userId);
      if (
        settled &&
        (opts.fresh
          ? settled.fetchedAt >= requestedAt
          : Date.now() - settled.fetchedAt < CACHE_TTL_MS)
      )
        return settled;
      try {
        return await this.readFresh();
      } catch (err) {
        if (!(err instanceof DriveNotFoundError)) throw err;
        this.ds.invalidateLayout();
        return this.readFresh();
      }
    });
    cache.set(this.ds.userId, entry);
    return entry.config;
  }

  async update(patch: AppConfigPatch): Promise<AppConfig> {
    return withUserLock(this.ds.userId, async () => {
      const entry = await this.readFresh();
      const draft = structuredClone(entry.config);
      const result = patch(draft) ?? draft;
      const next = appConfigSchema.parse({
        ...result,
        schemaVersion: APP_CONFIG_SCHEMA_VERSION,
        revision: entry.config.revision + 1,
        updatedAt: new Date().toISOString(),
      });
      return (await this.write(entry, next)).config;
    });
  }
}
