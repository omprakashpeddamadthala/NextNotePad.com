-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "geminiApiKey" TEXT,
    "geminiModel" TEXT,
    "agentRouterApiKey" TEXT,
    "claudeModel" TEXT,
    "updatedAt" DATETIME NOT NULL
);
