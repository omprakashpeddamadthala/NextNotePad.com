import assert from "node:assert/strict";
import type { drive_v3 } from "googleapis";
import { DriveService } from "@/lib/drive/driveService";
import * as workspaceService from "@/lib/drive/workspaceService";
import {
  cacheWorkspaceList,
  configureDriveDataClient,
  loadWorkspaceList,
  loadWorkspaceTree,
  prefetchFileContents,
  readDriveFileContent,
} from "@/services/storage/driveDataClient";
import { createFakeDrive } from "./drive-test/fakeDrive";

async function main() {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;
  let activeContentRequests = 0;
  let maxContentConcurrency = 0;

  globalThis.fetch = async (input) => {
    requestCount += 1;
    const url = String(input);

    if (url === "/api/workspaces") {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return Response.json({
        workspaces: [
          {
            id: "workspace-1",
            name: "Workspace",
            description: null,
            driveWorkspaceFolderId: "workspace-1",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        activeWorkspaceId: "workspace-1",
      });
    }

    if (url.startsWith("/api/workspace?")) {
      return Response.json({
        nodes: [],
        hasAnyHistory: false,
        workspaceId: "workspace-1",
      });
    }

    if (url.startsWith("/api/files/")) {
      activeContentRequests += 1;
      maxContentConcurrency = Math.max(
        maxContentConcurrency,
        activeContentRequests,
      );
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeContentRequests -= 1;
      return Response.json({ content: `content:${url}` });
    }

    return Response.json({ error: "Unexpected request" }, { status: 500 });
  };

  try {
    configureDriveDataClient(`cache-test-${Date.now()}`);

    const [first, duplicate] = await Promise.all([
      loadWorkspaceList(),
      loadWorkspaceList(),
    ]);
    assert.deepEqual(first, duplicate);
    assert.equal(
      requestCount,
      1,
      "concurrent workspace loads should deduplicate",
    );

    await loadWorkspaceList();
    assert.equal(
      requestCount,
      1,
      "fresh workspace list should come from cache",
    );

    await cacheWorkspaceList({
      ...first,
      activeWorkspaceId: "workspace-2",
    });
    assert.equal(
      (await loadWorkspaceList()).activeWorkspaceId,
      "workspace-2",
      "local workspace changes should update the cache",
    );

    await loadWorkspaceTree("workspace-1");
    await loadWorkspaceTree("workspace-1");
    assert.equal(
      requestCount,
      2,
      "fresh workspace tree should come from cache",
    );

    const [contentA, contentB] = await Promise.all([
      readDriveFileContent("file-1", 1),
      readDriveFileContent("file-1", 1),
    ]);
    assert.equal(contentA, contentB);
    assert.equal(requestCount, 3, "concurrent file reads should deduplicate");

    await readDriveFileContent("file-1", 1);
    assert.equal(
      requestCount,
      3,
      "matching file versions should use cached content",
    );

    await readDriveFileContent("file-1", 2);
    assert.equal(
      requestCount,
      4,
      "a changed Drive version should invalidate cached content",
    );

    const beforePrefetch = requestCount;
    await prefetchFileContents(
      Array.from({ length: 20 }, (_, index) => ({
        id: `prefetch-${index}`,
        version: 1,
        size: 128,
      })),
    );
    assert.equal(
      requestCount - beforePrefetch,
      12,
      "prefetch should enforce its item budget",
    );
    assert.ok(
      maxContentConcurrency <= 3,
      `prefetch concurrency exceeded 3 (${maxContentConcurrency})`,
    );

    const fake = createFakeDrive();
    const userId = `server-cache-${Date.now()}`;
    DriveService.clearCache(userId);
    const drive = new DriveService(
      fake.drive as unknown as drive_v3.Drive,
      userId,
    );
    const workspaceId = (await workspaceService.listWorkspaces(drive))[0].id;
    fake.calls.list = 0;
    await Promise.all([drive.listAllAppEntries(), drive.listAllAppEntries()]);
    assert.equal(
      fake.calls.list,
      1,
      "concurrent server list requests should deduplicate",
    );
    await drive.listAllAppEntries();
    assert.equal(
      fake.calls.list,
      1,
      "warm server list should use its short cache",
    );
    await workspaceService.createNode(drive, workspaceId, {
      type: "file",
      parentId: null,
      name: "invalidate.txt",
    });
    await drive.listAllAppEntries();
    assert.equal(
      fake.calls.list,
      2,
      "Drive writes should invalidate list cache",
    );

    console.log(
      JSON.stringify(
        {
          clientConcurrentWorkspaceRequests: "2 -> 1",
          clientWarmWorkspaceRequests: "1 -> 0",
          clientConcurrentFileRequests: "2 -> 1",
          boundedPrefetch: {
            candidates: 20,
            requested: 12,
            maxConcurrency: maxContentConcurrency,
          },
          serverConcurrentListRequests: "2 -> 1",
          serverWarmListRequests: "1 -> 0",
        },
        null,
        2,
      ),
    );
    console.log("Drive cache regression tests passed");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
