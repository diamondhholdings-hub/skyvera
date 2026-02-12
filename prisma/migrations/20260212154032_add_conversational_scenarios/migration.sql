-- CreateTable
CREATE TABLE "ScenarioConversation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL,
    "currentScenario" TEXT,
    "scenarioType" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "iterationCount" INTEGER NOT NULL DEFAULT 0,
    "finalRecommendation" TEXT,
    "wasImplemented" BOOLEAN NOT NULL DEFAULT false,
    "implementedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScenarioMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "promptUsed" TEXT,
    "tokensUsed" INTEGER,
    "confidence" TEXT,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScenarioMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ScenarioConversation" ("conversationId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScenarioVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "scenarioData" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "calculatedMetrics" TEXT NOT NULL,
    "claudeAnalysis" TEXT,
    "impactSummary" TEXT,
    "keyChanges" TEXT,
    "label" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScenarioVersion_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ScenarioConversation" ("conversationId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScenarioTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioConversation_conversationId_key" ON "ScenarioConversation"("conversationId");

-- CreateIndex
CREATE INDEX "ScenarioConversation_conversationId_idx" ON "ScenarioConversation"("conversationId");

-- CreateIndex
CREATE INDEX "ScenarioConversation_status_idx" ON "ScenarioConversation"("status");

-- CreateIndex
CREATE INDEX "ScenarioConversation_createdAt_idx" ON "ScenarioConversation"("createdAt");

-- CreateIndex
CREATE INDEX "ScenarioConversation_lastMessageAt_idx" ON "ScenarioConversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ScenarioMessage_conversationId_idx" ON "ScenarioMessage"("conversationId");

-- CreateIndex
CREATE INDEX "ScenarioMessage_createdAt_idx" ON "ScenarioMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ScenarioVersion_conversationId_idx" ON "ScenarioVersion"("conversationId");

-- CreateIndex
CREATE INDEX "ScenarioVersion_createdAt_idx" ON "ScenarioVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioVersion_conversationId_versionNumber_key" ON "ScenarioVersion"("conversationId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioTemplate_templateId_key" ON "ScenarioTemplate"("templateId");

-- CreateIndex
CREATE INDEX "ScenarioTemplate_templateId_idx" ON "ScenarioTemplate"("templateId");

-- CreateIndex
CREATE INDEX "ScenarioTemplate_category_idx" ON "ScenarioTemplate"("category");

-- CreateIndex
CREATE INDEX "ScenarioTemplate_usageCount_idx" ON "ScenarioTemplate"("usageCount");
