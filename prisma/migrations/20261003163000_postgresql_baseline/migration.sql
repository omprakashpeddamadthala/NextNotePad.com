-- PostgreSQL baseline for Drive-first deployments.
--
-- This migration is deliberately additive and idempotent. Existing PostgreSQL
-- deployments may already have these tables from an earlier `db push`, and may
-- also retain legacy Workspace / Folder / File / SyncFailure / UserSettings
-- tables used by the one-time Google Drive migration. Nothing here drops or
-- rewrites those legacy tables.

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "googleId" TEXT NOT NULL,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "googleTokenExpiresAt" TIMESTAMP(3),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "blocked" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");

CREATE TABLE IF NOT EXISTS "AppConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "geminiApiKey" TEXT,
    "geminiModel" TEXT,
    "agentRouterApiKey" TEXT,
    "claudeModel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "geminiApiKey" TEXT;
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "geminiModel" TEXT;
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "agentRouterApiKey" TEXT;
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "claudeModel" TEXT;
