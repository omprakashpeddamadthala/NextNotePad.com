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

const DEFAULT_WORKSPACE_NAME = "My Workspace";
const WORKSPACE_META_SCHEMA_VERSION = 1;

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

function isInternalEntry(e: DriveEntry) {
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

export async function listWorkspaces(ds: DriveService): Promise<DriveEntry[]> {
  const list = await listWorkspaceEntries(ds);
  if (list.length > 0) return list;
  return [await createWorkspaceFolder(ds, DEFAULT_WORKSPACE_NAME)];
}

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

function indexByParent(all: DriveEntry[]): Map<string, DriveEntry[]> {
  const byParent = new Map<string, DriveEntry[]>();
  for (const e of all) {
    for (const p of e.parents) {
      const list = byParent.get(p);
      if (list) list.push(e);
      else byParent.set(p, [e]);
    }
  }
  return byParent;
}

function buildTree(
  byParent: Map<string, DriveEntry[]>,
  workspaceId: string,
): NodeDto[] {
  const nodes: NodeDto[] = [];
  const pathOf = new Map<string, string>([[workspaceId, ""]]);
  let frontier = [workspaceId];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const parent of frontier) {
      for (const e of byParent.get(parent) ?? []) {
        if (isInternalEntry(e) || pathOf.has(e.id)) continue;
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

async function listAppEntriesWithWorkspaces(ds: DriveService) {
  const [workspacesId, all] = await Promise.all([
    ds.ensureWorkspacesFolder(),
    ds.listAllAppEntries(),
  ]);
  const workspaces = all
    .filter((e) => isFolder(e) && e.parents.includes(workspacesId))
    .sort((a, b) => a.createdTime - b.createdTime);
  return { all, workspaces };
}

export async function loadWorkspaceTree(
  ds: DriveService,
  workspaceId: string,
): Promise<NodeDto[]> {
  const all = await ds.listAllAppEntries();
  return buildTree(indexByParent(all), workspaceId);
}

export async function loadWorkspaceTreeForClient(
  ds: DriveService,
  workspaceId: string,
  opts: { validate?: boolean } = {},
): Promise<{ nodes: NodeDto[]; hasAnyHistory: boolean; workspaceId: string }> {
  const [nodes] = await Promise.all([
    loadWorkspaceTree(ds, workspaceId),
    opts.validate === false ? null : getWorkspace(ds, workspaceId),
  ]);
  const hasAnyHistory =
    nodes.length > 0 || (await ds.hasTrashedChildren(workspaceId));
  return { nodes, hasAnyHistory, workspaceId };
}

export async function loadAllWorkspaceTrees(ds: DriveService) {
  const { all, workspaces } = await listAppEntriesWithWorkspaces(ds);
  const byParent = indexByParent(all);
  const trees: Record<string, { nodes: NodeDto[]; hasAnyHistory: boolean }> =
    {};
  for (const w of workspaces) {
    const nodes = buildTree(byParent, w.id);
    trees[w.id] = { nodes, hasAnyHistory: nodes.length > 0 };
  }
  return { workspaces: workspaces.map(workspaceToDto), trees };
}

async function pathFor(
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

async function resolveParent(
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

export async function resolveRequestWorkspace(
  ds: DriveService,
  workspaceId: string,
): Promise<string> {
  return (await getWorkspace(ds, workspaceId)).id;
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

export async function listAllFiles(ds: DriveService) {
  const { all, workspaces } = await listAppEntriesWithWorkspaces(ds);
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
      version: e.version,
      workspaceId: loc.workspace.id,
      workspaceName: loc.workspace.name,
      updatedAt: new Date(e.modifiedTime).toISOString(),
    }));
}

export { stripNulls };
