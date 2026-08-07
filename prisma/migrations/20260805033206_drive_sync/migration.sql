-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "driveRootFolderId" TEXT;

-- CreateTable
CREATE TABLE "SyncFailure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SyncFailure_userId_idx" ON "SyncFailure"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncFailure_entityType_entityId_key" ON "SyncFailure"("entityType", "entityId");
