/* Drive performance benchmark — replays the Drive work each API route does against the in-memory
 * fake Drive with a simulated per-call network latency, and reports Drive API call counts and
 * wall time per user-facing scenario.
 *
 *   BENCH_MODE=before|after  which route logic to replay (default: after)
 *   BENCH_LATENCY_MS=120     simulated latency of every Drive API call
 *
 * "before" replays the route handlers as they were before the performance work (copied verbatim
 * below) and must be run from a checkout of that revision; "after" calls the current helpers the
 * routes use today. Run: npx tsx scripts/drive-perf-bench.ts */
import type { drive_v3 } from "googleapis";
import { DriveService } from "@/lib/drive/driveService";
import { AppConfigService } from "@/lib/drive/appConfigService";
import * as ws from "@/lib/drive/workspaceService";
import { createFakeDrive } from "./drive-test/fakeDrive";

const MODE = process.env.BENCH_MODE === "before" ? "before" : "after";
const LATENCY = Number(process.env.BENCH_LATENCY_MS ?? 120);
const USER = "bench-user";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fake = createFakeDrive();
let latency = 0;
for (const method of ["list", "get", "create", "update"] as const) {
  const files = fake.drive.files as Any;
  const original = files[method].bind(files);
  files[method] = async (...args: unknown[]) => {
    if (latency > 0) await sleep(latency);
    return original(...args);
  };
}

function totalCalls(): number {
  return Object.values(fake.calls).reduce((a, b) => a + b, 0);
}

function freshService(opts: { keepCaches?: boolean } = {}): DriveService {
  if (!opts.keepCaches) {
    DriveService.clearCache(USER);
    AppConfigService.clearCache(USER);
  }
  return new DriveService(fake.drive as unknown as drive_v3.Drive, USER);
}

async function measure<T>(fn: () => Promise<T>) {
  const before = totalCalls();
  const started = performance.now();
  const value = await fn();
  return {
    value,
    ms: Math.round(performance.now() - started),
    calls: totalCalls() - before,
  };
}

// ---------------------------------------------------------------------------------------------
// Seed: 3 workspaces × (5 root files + 5 folders → 2 subfolders → 1 sub-subfolder, 4 files each)
// ---------------------------------------------------------------------------------------------
let workspaceIds: string[] = [];
let deepFileId = "";
let deepFolderId = "";

async function seed() {
  const ds = freshService();
  const first = (await ws.listWorkspaces(ds))[0];
  const second = await ws.createWorkspaceFolder(ds, "Project Alpha");
  const third = await ws.createWorkspaceFolder(ds, "Notes Archive");
  workspaceIds = [first.id, second.id, third.id];
  for (const wsId of workspaceIds) {
    for (let r = 0; r < 5; r++)
      await ws.createNode(ds, wsId, { type: "file", parentId: null, name: `root-${r}.md`, content: `# ${r}` });
    for (let f = 0; f < 5; f++) {
      const top = await ws.createNode(ds, wsId, { type: "folder", parentId: null, name: `folder-${f}` });
      for (let i = 0; i < 4; i++)
        await ws.createNode(ds, wsId, { type: "file", parentId: top.id, name: `top-${i}.txt`, content: "x".repeat(200) });
      for (let s = 0; s < 2; s++) {
        const sub = await ws.createNode(ds, wsId, { type: "folder", parentId: top.id, name: `sub-${s}` });
        for (let i = 0; i < 4; i++)
          await ws.createNode(ds, wsId, { type: "file", parentId: sub.id, name: `sub-${i}.ts`, content: "let a = 1;" });
        const deep = await ws.createNode(ds, wsId, { type: "folder", parentId: sub.id, name: "deep" });
        for (let i = 0; i < 4; i++) {
          const file = await ws.createNode(ds, wsId, { type: "file", parentId: deep.id, name: `deep-${i}.json`, content: "{}" });
          if (!deepFileId && wsId === first.id) {
            deepFileId = file.id;
            deepFolderId = deep.id;
          }
        }
      }
    }
  }
  await ws.setActiveWorkspace(ds, first.id);
}

// ---------------------------------------------------------------------------------------------
// Route logic, as replayed per mode
// ---------------------------------------------------------------------------------------------
const routes = {
  /** GET /api/workspaces */
  async workspaces(ds: DriveService) {
    const [list, config] = await Promise.all([ws.listWorkspaces(ds), new AppConfigService(ds).load()]);
    if (!config.activeWorkspaceId || !list.some((w) => w.id === config.activeWorkspaceId))
      await ws.setActiveWorkspace(ds, list[0].id);
    return list;
  },
  /** GET /api/workspace?workspaceId= */
  async tree(ds: DriveService, workspaceId: string) {
    if (MODE === "before") {
      await ws.getWorkspace(ds, workspaceId);
      const nodes = await ws.loadWorkspaceTree(ds, workspaceId);
      return nodes.length > 0 || (await ds.hasTrashedChildren(workspaceId));
    }
    return (ws as Any).loadWorkspaceTreeForClient(ds, workspaceId);
  },
  /** GET /api/settings */
  async settings(ds: DriveService) {
    return new AppConfigService(ds).load({ fresh: true });
  },
  /** GET /api/workspaces/trees (new: every workspace's tree in one Drive listing) */
  async allTrees(ds: DriveService) {
    return (ws as Any).loadAllWorkspaceTrees(ds);
  },
  /** GET /api/files (Quick Open index) */
  async fileIndex(ds: DriveService) {
    return ws.listAllFiles(ds);
  },
  /** POST /api/workspaces/[id]/switch */
  async switchWorkspace(ds: DriveService, id: string) {
    await ws.getWorkspace(ds, id);
    await ws.setActiveWorkspace(ds, id);
  },
  /** GET /api/files/[id]?workspaceId= — what the client needs to open a file */
  async openFile(ds: DriveService, id: string, workspaceId: string) {
    if (MODE === "before") {
      await ws.getWorkspace(ds, workspaceId);
      const entry = await ws.getNode(ds, id);
      await ws.assertNodeInWorkspace(ds, entry, workspaceId);
      const content = await ds.readText(id);
      return { ...(await ws.nodeDto(ds, entry, workspaceId)), content };
    }
    return (ws as Any).readFileContentForClient(ds, id);
  },
  /** PATCH /api/files/[id] { content } — the autosave hot path */
  async autosave(ds: DriveService, id: string, workspaceId: string) {
    const wsId =
      MODE === "before" ? await ws.resolveActiveWorkspaceId(ds) : workspaceId; // after: client sends ?workspaceId=
    const entry = await ws.updateNode(ds, wsId, id, { content: `saved ${Date.now()}` });
    return ws.entryToNodeDto(entry, entry.parents[0] === wsId ? null : entry.parents[0], "");
  },
  /** POST /api/files — create a file inside a nested folder */
  async createFile(ds: DriveService, parentId: string, workspaceId: string, name: string) {
    const wsId =
      MODE === "before"
        ? await ws.resolveActiveWorkspaceId(ds)
        : await (ws as Any).resolveRequestWorkspace(ds, workspaceId);
    const entry = await ws.createNode(ds, wsId, { type: "file", parentId, name, content: "" });
    return ws.nodeDto(ds, entry, wsId);
  },
};

// ---------------------------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------------------------
async function main() {
  await seed();
  latency = LATENCY;
  const [active, other] = workspaceIds;
  const results: Record<string, unknown> = {};

  // 1. App startup against a cold server process: the three requests the client fires at once.
  {
    const ds = freshService();
    let treeReadyMs = 0;
    const started = performance.now();
    const r = await measure(() =>
      Promise.all([
        routes.workspaces(ds),
        routes.tree(ds, active).then(() => (treeReadyMs = Math.round(performance.now() - started))),
        routes.settings(ds),
      ]),
    );
    results["startup: time until active tree is served (ms)"] = treeReadyMs;
    results["startup: all startup requests done (ms)"] = r.ms;
    results["startup: Drive calls"] = r.calls;
  }

  // 1b. Idle prefetch right after startup (after mode only): every tree + the Quick Open index.
  if (MODE === "after") {
    const ds = freshService({ keepCaches: true });
    const r = await measure(() => Promise.all([routes.allTrees(ds), routes.fileIndex(ds)]));
    results["idle prefetch (all trees + search index): ms"] = r.ms;
    results["idle prefetch (all trees + search index): Drive calls"] = r.calls;
  }

  // 2. Workspace switch. Before: the client awaited the switch POST and the tree in parallel.
  //    After: the tree is already cached client-side, so the UI does not wait at all; the POST
  //    and a background revalidation still run and are measured here.
  {
    await sleep(3_100); // let the 3s server list cache expire, as it would between user actions
    const ds = freshService({ keepCaches: true });
    const r = await measure(() => Promise.all([routes.switchWorkspace(ds, other), routes.tree(ds, other)]));
    results["switch: server work (ms)"] = r.ms;
    results["switch: Drive calls"] = r.calls;
    results["switch: user-perceived wait (ms)"] = MODE === "before" ? r.ms : 0;
  }

  // 3. Opening a file 3 folders deep that is not in the client content cache.
  {
    const ds = freshService();
    const r = await measure(() => routes.openFile(ds, deepFileId, active));
    results["open uncached deep file: ms"] = r.ms;
    results["open uncached deep file: Drive calls"] = r.calls;
  }

  // 4. Autosave with the 15s appConfig cache expired (any save after 15s of not saving).
  {
    const ds = freshService();
    await ds.ensureRootFolder(); // folder ids are cached for the life of the process in both modes
    const r = await measure(() => routes.autosave(ds, deepFileId, active));
    results["autosave (config cache cold): ms"] = r.ms;
    results["autosave (config cache cold): Drive calls"] = r.calls;
  }

  // 5. Creating a file in a nested folder, cold metadata caches.
  {
    const ds = freshService();
    await ds.ensureWorkspacesFolder();
    await ws.setActiveWorkspace(ds, active); // scenario 2 switched away; not measured
    AppConfigService.clearCache(USER);
    const r = await measure(() => routes.createFile(ds, deepFolderId, active, `bench-${Date.now()}.txt`));
    results["create nested file: ms"] = r.ms;
    results["create nested file: Drive calls"] = r.calls;
  }

  // 6. Four concurrent requests that each need .appConfig.json on a cold server process.
  {
    const ds = freshService();
    await ds.ensureRootFolder();
    const r = await measure(() => Promise.all(Array.from({ length: 4 }, () => new AppConfigService(ds).load())));
    results["4 concurrent appConfig loads: Drive calls"] = r.calls;
    results["4 concurrent appConfig loads: ms"] = r.ms;
  }

  console.log(JSON.stringify({ mode: MODE, latencyMsPerDriveCall: LATENCY, results }, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
