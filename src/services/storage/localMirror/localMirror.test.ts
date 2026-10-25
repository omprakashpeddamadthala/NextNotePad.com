import assert from "node:assert/strict";
import test from "node:test";
import type { WorkspaceNode } from "@/types/file";
import { buildMirrorPlan, sanitizeSegment, type MirrorWorkspace } from "./mirrorPlan";
import { reconcileMirror, readManifest, type Manifest } from "./mirrorEngine";

// ---------------------------------------------------------------------------
// In-memory stand-in for FileSystemDirectoryHandle
// ---------------------------------------------------------------------------

let clock = 1_000;

function domError(name: string): Error {
  const err = new Error(name);
  err.name = name;
  return err;
}

class FakeFile {
  constructor(
    public content: string,
    public lastModified = clock++,
  ) {}
}

class FakeDir {
  entries = new Map<string, FakeDir | FakeFile>();
  constructor(public name = "root") {}

  async getDirectoryHandle(name: string, opts?: { create?: boolean }) {
    const hit = this.entries.get(name);
    if (hit instanceof FakeDir) return hit;
    if (hit) throw domError("TypeMismatchError");
    if (!opts?.create) throw domError("NotFoundError");
    const dir = new FakeDir(name);
    this.entries.set(name, dir);
    return dir;
  }

  async getFileHandle(name: string, opts?: { create?: boolean }) {
    let hit = this.entries.get(name);
    if (hit instanceof FakeDir) throw domError("TypeMismatchError");
    if (!hit) {
      if (!opts?.create) throw domError("NotFoundError");
      hit = new FakeFile("");
      this.entries.set(name, hit);
    }
    const file = hit;
    return {
      getFile: async () =>
        new File([file.content], name, { lastModified: file.lastModified }),
      createWritable: async () => {
        let buffer = "";
        return {
          write: async (data: string) => {
            buffer += data;
          },
          close: async () => {
            file.content = buffer;
            file.lastModified = clock++;
          },
        };
      },
    };
  }

  async removeEntry(name: string) {
    const hit = this.entries.get(name);
    if (!hit) throw domError("NotFoundError");
    if (hit instanceof FakeDir && hit.entries.size > 0)
      throw domError("InvalidModificationError");
    this.entries.delete(name);
  }

  private lookup(path: string): FakeDir | FakeFile | undefined {
    const [head, ...rest] = path.split("/");
    const child = this.entries.get(head);
    if (rest.length === 0) return child;
    return child instanceof FakeDir ? child.lookup(rest.join("/")) : undefined;
  }

  read(path: string): string | undefined {
    const node = this.lookup(path);
    return node instanceof FakeFile ? node.content : undefined;
  }

  file(path: string): FakeFile | undefined {
    const node = this.lookup(path);
    return node instanceof FakeFile ? node : undefined;
  }

  /** All file paths below this folder, sorted. */
  list(prefix = ""): string[] {
    const out: string[] = [];
    for (const [name, child] of this.entries) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (child instanceof FakeDir) out.push(...child.list(path));
      else out.push(path);
    }
    return out.sort();
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function file(
  id: string,
  name: string,
  parentId: string | null,
  extra: Partial<WorkspaceNode> = {},
): WorkspaceNode {
  return {
    id,
    name,
    path: "",
    parentId,
    createdAt: Number(id.replace(/\D/g, "")) || 0,
    updatedAt: 0,
    lastSynced: null,
    version: 1,
    checksum: null,
    deleted: false,
    hidden: false,
    type: "file",
    language: "plaintext",
    encoding: "UTF-8",
    size: 0,
    pinnedFavorite: false,
    locked: false,
    encryptionSalt: null,
    encryptionIv: null,
    ...extra,
  } as WorkspaceNode;
}

function folder(id: string, name: string, parentId: string | null): WorkspaceNode {
  return {
    id,
    name,
    path: "",
    parentId,
    createdAt: Number(id.replace(/\D/g, "")) || 0,
    updatedAt: 0,
    lastSynced: null,
    version: 1,
    checksum: null,
    deleted: false,
    hidden: false,
    type: "folder",
    collapsed: true,
  };
}

const WS: MirrorWorkspace[] = [{ id: "ws1", name: "My Workspace" }];

function harness() {
  const dir = new FakeDir();
  const manifest: Manifest = { schemaVersion: 1, userId: "u1", files: {} };
  const content = new Map<string, string>();
  const pending = new Map<string, string>();
  const sync = (
    nodes: WorkspaceNode[] | undefined,
    opts: { full?: boolean; workspaces?: MirrorWorkspace[] } = {},
  ) => {
    const workspaces = opts.workspaces ?? WS;
    const trees = nodes ? { ws1: nodes } : {};
    return reconcileMirror({
      dir: dir as unknown as FileSystemDirectoryHandle,
      manifest,
      plan: buildMirrorPlan(workspaces, trees),
      knownWorkspaceIds: new Set(workspaces.map((w) => w.id)),
      loadedWorkspaceIds: new Set(Object.keys(trees)),
      full: opts.full ?? false,
      pendingContent: pending,
      readContent: async (t) => content.get(t.fileId) ?? "",
    });
  };
  return { dir, manifest, content, pending, sync };
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

test("sanitizeSegment makes Drive names safe for Windows", () => {
  assert.equal(sanitizeSegment('a:b*c?"d<e>f|g'), "a_b_c__d_e_f_g");
  assert.equal(sanitizeSegment("notes. "), "notes");
  assert.equal(sanitizeSegment("CON"), "_CON");
  assert.equal(sanitizeSegment("nul.txt"), "_nul.txt");
  assert.equal(sanitizeSegment(""), "_");
  assert.equal(sanitizeSegment(".."), "_");
  assert.equal(sanitizeSegment(".nextnotepad"), "_.nextnotepad");
  const long = sanitizeSegment(`${"x".repeat(300)}.md`);
  assert.equal(long.length, 200);
  assert.ok(long.endsWith(".md"));
});

test("buildMirrorPlan nests folders and de-duplicates names case-insensitively", () => {
  const plan = buildMirrorPlan(
    [...WS, { id: "ws2", name: "my workspace" }],
    {
      ws1: [
        folder("d1", "Docs", null),
        file("f2", "a.txt", "d1"),
        file("f3", "A.txt", "d1"),
        file("f4", "docs", null),
        file("f5", "gone.txt", null, { deleted: true }),
        file("f6", "orphan.txt", "missing"),
      ],
      ws2: [file("f7", "b.md", null)],
    },
  );
  assert.equal(plan.get("f2")?.path, "My Workspace/Docs/a.txt");
  assert.equal(plan.get("f3")?.path, "My Workspace/Docs/A (2).txt");
  assert.equal(plan.get("f4")?.path, "My Workspace/docs (2)");
  assert.equal(plan.get("f7")?.path, "my workspace (2)/b.md");
  assert.equal(plan.has("f5"), false);
  assert.equal(plan.has("f6"), false);
});

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

test("first sync writes every note and a manifest", async () => {
  const h = harness();
  h.content.set("f2", "hello").set("f3", "world");
  const r = await h.sync([folder("d1", "Docs", null), file("f2", "a.txt", "d1"), file("f3", "b.txt", null)]);
  assert.equal(r.failed, 0);
  assert.equal(h.dir.read("My Workspace/Docs/a.txt"), "hello");
  assert.equal(h.dir.read("My Workspace/b.txt"), "world");
  const saved = await readManifest(h.dir as unknown as FileSystemDirectoryHandle, "u1");
  assert.deepEqual(Object.keys(saved.files).sort(), ["f2", "f3"]);
});

test("unchanged notes are not rewritten on incremental runs", async () => {
  const h = harness();
  h.content.set("f1", "x");
  const nodes = [file("f1", "a.txt", null)];
  await h.sync(nodes);
  const before = h.dir.file("My Workspace/a.txt")!.lastModified;
  const r = await h.sync(nodes);
  assert.equal(r.changes, 0);
  assert.equal(h.dir.file("My Workspace/a.txt")!.lastModified, before);
});

test("saved content is written without reading from Drive", async () => {
  const h = harness();
  h.content.set("f1", "old");
  const nodes = [file("f1", "a.txt", null)];
  await h.sync(nodes);
  h.pending.set("f1", "new");
  await h.sync(nodes);
  assert.equal(h.dir.read("My Workspace/a.txt"), "new");
  assert.equal(h.pending.size, 0);
});

test("renames and moves relocate the file and prune empty folders", async () => {
  const h = harness();
  h.content.set("f2", "x");
  await h.sync([folder("d1", "Old", null), file("f2", "a.txt", "d1")]);
  await h.sync([folder("d1", "Old", null), file("f2", "b.txt", null)]);
  assert.deepEqual(h.dir.list(), [".nextnotepad/manifest.json", "My Workspace/b.txt"]);
});

test("deleted notes go to trash instead of disappearing", async () => {
  const h = harness();
  h.content.set("f1", "keep me");
  await h.sync([file("f1", "a.txt", null)]);
  await h.sync([]);
  assert.equal(h.dir.read("My Workspace/a.txt"), undefined);
  const trashed = h.dir.list().filter((p) => p.includes("/trash/"));
  assert.equal(trashed.length, 1);
  assert.ok(trashed[0].endsWith("/My Workspace/a.txt"));
  assert.equal(h.dir.read(trashed[0]), "keep me");
  assert.deepEqual(h.manifest.files, {});
});

test("locked notes are removed from disk and never trashed", async () => {
  const h = harness();
  h.content.set("f1", "secret");
  await h.sync([file("f1", "a.txt", null)]);
  await h.sync([file("f1", "a.txt", null, { locked: true })]);
  assert.deepEqual(h.dir.list(), [".nextnotepad/manifest.json"]);
});

test("local edits are backed up before being overwritten", async () => {
  const h = harness();
  h.content.set("f1", "v1");
  await h.sync([file("f1", "a.txt", null)]);
  const local = h.dir.file("My Workspace/a.txt")!;
  local.content = "edited on disk";
  local.lastModified = clock++;
  h.content.set("f1", "v2");
  await h.sync([file("f1", "a.txt", null, { version: 2 })]);
  assert.equal(h.dir.read("My Workspace/a.txt"), "v2");
  const backups = h.dir.list().filter((p) => p.includes("/local-changes/"));
  assert.equal(backups.length, 1);
  assert.equal(h.dir.read(backups[0]), "edited on disk");
});

test("an existing unrelated file in the folder is backed up, not clobbered", async () => {
  const h = harness();
  await h.dir.getDirectoryHandle("My Workspace", { create: true }).then((d) =>
    d.entries.set("a.txt", new FakeFile("user's own file")),
  );
  h.content.set("f1", "note");
  await h.sync([file("f1", "a.txt", null)]);
  assert.equal(h.dir.read("My Workspace/a.txt"), "note");
  const backups = h.dir.list().filter((p) => p.includes("/local-changes/"));
  assert.equal(h.dir.read(backups[0]), "user's own file");
});

test("swapping two names keeps both files and makes no backups", async () => {
  const h = harness();
  h.content.set("f1", "one").set("f2", "two");
  await h.sync([file("f1", "a.txt", null), file("f2", "b.txt", null)]);
  await h.sync([file("f1", "b.txt", null), file("f2", "a.txt", null)]);
  assert.equal(h.dir.read("My Workspace/b.txt"), "one");
  assert.equal(h.dir.read("My Workspace/a.txt"), "two");
  assert.deepEqual(h.dir.list().filter((p) => p.startsWith(".nextnotepad/") && !p.endsWith("manifest.json")), []);
});

test("files of a workspace whose tree failed to load are left alone", async () => {
  const h = harness();
  h.content.set("f1", "x");
  await h.sync([file("f1", "a.txt", null)]);
  const r = await h.sync(undefined);
  assert.equal(r.changes, 0);
  assert.equal(h.dir.read("My Workspace/a.txt"), "x");
});

test("a deleted workspace is moved to trash", async () => {
  const h = harness();
  h.content.set("f1", "x");
  await h.sync([file("f1", "a.txt", null)]);
  await h.sync(undefined, { workspaces: [] });
  assert.equal(h.dir.read("My Workspace/a.txt"), undefined);
  assert.equal(h.dir.list().filter((p) => p.includes("/trash/")).length, 1);
});

test("full runs restore files deleted from disk", async () => {
  const h = harness();
  h.content.set("f1", "x");
  const nodes = [file("f1", "a.txt", null)];
  await h.sync(nodes);
  (await h.dir.getDirectoryHandle("My Workspace")).entries.clear();
  await h.sync(nodes);
  assert.equal(h.dir.read("My Workspace/a.txt"), undefined);
  await h.sync(nodes, { full: true });
  assert.equal(h.dir.read("My Workspace/a.txt"), "x");
});

test("a folder owned by another account is refused", async () => {
  const h = harness();
  h.content.set("f1", "x");
  await h.sync([file("f1", "a.txt", null)]);
  await assert.rejects(
    readManifest(h.dir as unknown as FileSystemDirectoryHandle, "someone-else"),
    /another account/,
  );
});
