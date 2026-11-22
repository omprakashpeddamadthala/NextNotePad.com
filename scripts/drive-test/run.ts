import assert from "node:assert/strict";
import type { drive_v3 } from "googleapis";
import { DriveService, APP_CONFIG_FILE_NAME } from "@/lib/drive/driveService";
import { AppConfigService } from "@/lib/drive/appConfigService";
import * as ws from "@/lib/drive/workspaceService";
import { createFakeDrive } from "./fakeDrive";

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}`);
    throw err;
  }
}

function service(fake: ReturnType<typeof createFakeDrive>, userId: string) {
  DriveService.clearCache(userId);
  AppConfigService.clearCache(userId);
  return new DriveService(fake.drive as unknown as drive_v3.Drive, userId);
}

async function main() {
  console.log("Drive-first services");

  await test("new user: root, Workspaces folder, .appConfig.json and default workspace are created", async () => {
    const fake = createFakeDrive();
    const ds = service(fake, "new-user");
    const list = await ws.listWorkspaces(ds);
    assert.equal(list.length, 1);
    assert.equal(list[0].name, "My Workspace");
    const config = await new AppConfigService(ds).load();
    assert.equal(config.schemaVersion, 1);
    const names = [...fake.files.values()].map((f) => f.name).sort();
    assert.deepEqual(names, [
      ".appConfig.json",
      ".workspace.json",
      "My Workspace",
      "NextNotePad.com",
      "Workspaces",
    ]);
  });

  await test("file/folder CRUD, move, rename, metadata and tree load", async () => {
    const fake = createFakeDrive();
    const ds = service(fake, "crud");
    const wsId = (await ws.listWorkspaces(ds))[0].id;
    const folder = await ws.createNode(ds, wsId, {
      type: "folder",
      parentId: null,
      name: "src",
    });
    const sub = await ws.createNode(ds, wsId, {
      type: "folder",
      parentId: folder.id,
      name: "lib",
    });
    const file = await ws.createNode(ds, wsId, {
      type: "file",
      parentId: folder.id,
      name: "a.ts",
      content: "x",
    });
    assert.equal((await ws.nodeDto(ds, file, wsId)).path, "/src/a.ts");

    await ws.updateNode(ds, wsId, file.id, { content: "hello" });
    assert.equal(await ds.readText(file.id), "hello");
    const renamed = ws.entryToNodeDto(
      await ws.updateNode(ds, wsId, file.id, { name: "a.md" }),
      null,
      "",
    );
    assert.ok(renamed.type === "file" && renamed.language === "markdown");
    await ws.updateNode(ds, wsId, file.id, { parentId: sub.id });
    await ws.updateNode(ds, wsId, folder.id, {
      collapsed: false,
      hidden: true,
    });
    await ws.updateNode(ds, wsId, file.id, {
      locked: true,
      encryptionSalt: "c2FsdA==",
      encryptionIv: "aXY=",
    });

    await assert.rejects(
      ws.updateNode(ds, wsId, folder.id, { parentId: sub.id }),
      /into itself/,
    );

    const tree = await ws.loadWorkspaceTree(ds, wsId);
    const byName = Object.fromEntries(tree.map((n) => [n.name, n]));
    assert.equal(byName["a.md"].path, "/src/lib/a.md");
    assert.equal(byName["a.md"].parentId, sub.id);
    assert.equal(byName["src"].parentId, null);
    assert.ok(
      byName["src"].type === "folder" &&
        byName["src"].collapsed === false &&
        byName["src"].hidden,
    );
    assert.ok(
      byName["a.md"].type === "file" &&
        byName["a.md"].locked &&
        byName["a.md"].encryptionIv === "aXY=",
    );
    assert.ok(!tree.some((n) => n.name === ".workspace.json"));

    await ws.trashNode(ds, folder.id);
    assert.equal((await ws.loadWorkspaceTree(ds, wsId)).length, 0);
    assert.equal(await ds.hasTrashedChildren(wsId), true);
  });

  await test("tree load is one list request per depth level, not per folder", async () => {
    const fake = createFakeDrive();
    const ds = service(fake, "perf");
    const wsId = (await ws.listWorkspaces(ds))[0].id;
    for (let i = 0; i < 30; i++) {
      const f = await ws.createNode(ds, wsId, {
        type: "folder",
        parentId: null,
        name: `f${i}`,
      });
      for (let j = 0; j < 20; j++)
        await ws.createNode(ds, wsId, {
          type: "file",
          parentId: f.id,
          name: `n${j}.txt`,
        });
    }
    fake.calls.list = 0;
    const tree = await ws.loadWorkspaceTree(ds, wsId);
    assert.equal(tree.length, 630);
    assert.ok(
      fake.calls.list <= 3,
      `expected <=3 list calls, got ${fake.calls.list}`,
    );
  });

  await test("identical list requests are deduplicated, briefly cached, and invalidated on writes", async () => {
    const fake = createFakeDrive();
    const ds = service(fake, "list-cache");
    const workspaceId = (await ws.listWorkspaces(ds))[0].id;
    fake.calls.list = 0;

    await Promise.all([ds.listAllAppEntries(), ds.listAllAppEntries()]);
    assert.equal(fake.calls.list, 1);
    await ds.listAllAppEntries();
    assert.equal(fake.calls.list, 1);

    await ws.createNode(ds, workspaceId, {
      type: "file",
      parentId: null,
      name: "invalidates.txt",
    });
    await ds.listAllAppEntries();
    assert.equal(fake.calls.list, 2);
  });

  await test("content-only save is a single Drive update (no metadata read)", async () => {
    const fake = createFakeDrive();
    const ds = service(fake, "hot");
    const wsId = (await ws.listWorkspaces(ds))[0].id;
    const file = await ws.createNode(ds, wsId, {
      type: "file",
      parentId: null,
      name: "x.txt",
    });
    fake.calls.get = 0;
    fake.calls.update = 0;
    await ws.updateNode(ds, wsId, file.id, { content: "abc" });
    assert.equal(fake.calls.get, 0);
    assert.equal(fake.calls.update, 1);
  });

  await test("workspaces: create, duplicate-name guard, rename, switch, cross-workspace index", async () => {
    const fake = createFakeDrive();
    const ds = service(fake, "multi");
    const first = (await ws.listWorkspaces(ds))[0];
    const second = await ws.createWorkspaceFolder(ds, "Second", "desc");
    await ws.setActiveWorkspace(ds, second.id);
    assert.equal(await ws.resolveActiveWorkspaceId(ds), second.id);
    await assert.rejects(
      ws.renameWorkspace(ds, second.id, { name: first.name }),
      /already exists/,
    );
    const renamed = await ws.renameWorkspace(ds, second.id, {
      name: "Renamed",
    });
    assert.equal(renamed.name, "Renamed");
    const meta = [...fake.files.values()].find(
      (f) => f.name === ".workspace.json" && f.parents.includes(second.id),
    )!;
    assert.equal(JSON.parse(meta.content).name, "Renamed");
    await ws.createNode(ds, first.id, {
      type: "file",
      parentId: null,
      name: "one.txt",
    });
    await ws.createNode(ds, second.id, {
      type: "file",
      parentId: null,
      name: "two.txt",
    });
    const all = await ws.listAllFiles(ds);
    assert.deepEqual(all.map((f) => `${f.workspaceName}:${f.path}`).sort(), [
      "My Workspace:/one.txt",
      "Renamed:/two.txt",
    ]);
    assert.ok(all.every((file) => file.version > 0));
    await assert.rejects(
      ws.getWorkspace(ds, await ds.ensureRootFolder()),
      /not found/i,
    );
  });

  await test("appConfig: patch merges into fresh read (no lost update across devices)", async () => {
    const fake = createFakeDrive();
    const a = service(fake, "conf");
    await new AppConfigService(a).update((c) => {
      c.settings.theme = "dracula";
    });
    const cfg = [...fake.files.values()].find(
      (f) => f.name === APP_CONFIG_FILE_NAME,
    )!;
    const other = JSON.parse(cfg.content);
    other.favorites = ["from-other-device"];
    cfg.content = JSON.stringify(other);
    const after = await new AppConfigService(a).update((c) => {
      c.recentFiles = [{ fileId: "x", openedAt: 1 }];
    });
    assert.equal(after.settings.theme, "dracula");
    assert.deepEqual(after.favorites, ["from-other-device"]);
    assert.equal(after.revision, 2);
  });

  await test("appConfig: corrupted file is backed up, not destroyed", async () => {
    const fake = createFakeDrive();
    const ds = service(fake, "corrupt");
    await new AppConfigService(ds).load();
    const cfg = [...fake.files.values()].find(
      (f) => f.name === APP_CONFIG_FILE_NAME,
    )!;
    cfg.content = "{not json";
    AppConfigService.clearCache("corrupt");
    const loaded = await new AppConfigService(ds).load();
    assert.equal(loaded.schemaVersion, 1);
    const backup = [...fake.files.values()].find((f) =>
      f.name.startsWith(".appConfig.corrupted-"),
    );
    assert.equal(backup?.content, "{not json");
  });

  await test("appConfig: unversioned legacy config is migrated and unknown keys preserved", async () => {
    const fake = createFakeDrive();
    const ds = service(fake, "v0");
    const rootId = await ds.ensureRootFolder();
    await ds.createFile(
      APP_CONFIG_FILE_NAME,
      rootId,
      JSON.stringify({ futureKey: 42, favorites: ["a"] }),
    );
    const loaded = await new AppConfigService(ds).load();
    assert.equal(loaded.schemaVersion, 1);
    assert.equal((loaded as Record<string, unknown>).futureKey, 42);
    const stored = JSON.parse(
      [...fake.files.values()].find((f) => f.name === APP_CONFIG_FILE_NAME)!
        .content,
    );
    assert.equal(stored.schemaVersion, 1);
  });

  console.log(`\n${passed} passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
