import type { WorkspaceNode } from "@/types/file";

/** Folder inside the mirror root that holds the manifest, trash and backups. */
export const MIRROR_META_DIR = ".nextnotepad";

export interface MirrorWorkspace {
  id: string;
  name: string;
}

export interface MirrorTarget {
  fileId: string;
  workspaceId: string;
  /** Relative path inside the mirror root, segments joined by "/". */
  path: string;
  version: number;
  size: number;
  locked: boolean;
}

const INVALID_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const MAX_SEGMENT_LENGTH = 200;

/** Turns a Drive name into a name that is valid on Windows, macOS and Linux. */
export function sanitizeSegment(name: string): string {
  let s = name.replace(INVALID_CHARS, "_").replace(/[. ]+$/, "").trim();
  if (!s || s === "." || s === "..") s = "_";
  if (RESERVED_NAMES.test(s)) s = `_${s}`;
  if (s.toLowerCase() === MIRROR_META_DIR) s = `_${s}`;
  if (s.length > MAX_SEGMENT_LENGTH) {
    const dot = s.lastIndexOf(".");
    const ext = dot > 0 && s.length - dot <= 16 ? s.slice(dot) : "";
    s = s.slice(0, MAX_SEGMENT_LENGTH - ext.length) + ext;
  }
  return s;
}

/** Appends " (2)", " (3)"… before the extension until the name is unused. */
function uniqueName(name: string, taken: Set<string>): string {
  let candidate = name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
    candidate = `${base} (${n})${ext}`;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}

function bySiblingOrder(a: WorkspaceNode, b: WorkspaceNode): number {
  return a.createdAt - b.createdAt || a.id.localeCompare(b.id);
}

/**
 * Computes where every Drive file should live in the local mirror. Sibling
 * names that collide (Drive allows duplicates, Windows is case-insensitive)
 * get a numeric suffix in a stable order so paths don't shuffle between runs.
 */
export function buildMirrorPlan(
  workspaces: MirrorWorkspace[],
  trees: Record<string, WorkspaceNode[] | undefined>,
): Map<string, MirrorTarget> {
  const plan = new Map<string, MirrorTarget>();
  const rootNames = new Set<string>();

  for (const ws of workspaces) {
    const nodes = trees[ws.id];
    if (!nodes) continue;
    const wsDir = uniqueName(sanitizeSegment(ws.name), rootNames);

    const children = new Map<string | null, WorkspaceNode[]>();
    for (const node of nodes) {
      if (node.deleted) continue;
      const list = children.get(node.parentId) ?? [];
      list.push(node);
      children.set(node.parentId, list);
    }

    const walk = (parentId: string | null, dir: string) => {
      const kids = (children.get(parentId) ?? []).sort(bySiblingOrder);
      const taken = new Set<string>();
      // Folders claim names first so a file can't push a folder to "x (2)".
      for (const node of kids.filter((n) => n.type === "folder")) {
        const name = uniqueName(sanitizeSegment(node.name), taken);
        walk(node.id, `${dir}/${name}`);
      }
      for (const node of kids) {
        if (node.type !== "file") continue;
        const name = uniqueName(sanitizeSegment(node.name), taken);
        plan.set(node.id, {
          fileId: node.id,
          workspaceId: ws.id,
          path: `${dir}/${name}`,
          version: node.version,
          size: node.size,
          locked: node.locked,
        });
      }
    };
    walk(null, wsDir);
  }

  return plan;
}
