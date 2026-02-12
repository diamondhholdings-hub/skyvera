-- CreateTable
CREATE TABLE "DMRecommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recommendationId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bu" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "arrImpact" REAL NOT NULL,
    "dmImpact" REAL NOT NULL,
    "marginImpact" REAL NOT NULL,
    "confidenceLevel" INTEGER NOT NULL,
    "timeline" TEXT NOT NULL,
    "ownerTeam" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deferredReason" TEXT,
    "linkedActionItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "DMRecommendation_recommendationId_key" ON "DMRecommendation"("recommendationId");

-- CreateIndex
CREATE INDEX "DMRecommendation_recommendationId_idx" ON "DMRecommendation"("recommendationId");

-- CreateIndex
CREATE INDEX "DMRecommendation_accountName_idx" ON "DMRecommendation"("accountName");

-- CreateIndex
CREATE INDEX "DMRecommendation_bu_idx" ON "DMRecommendation"("bu");

-- CreateIndex
CREATE INDEX "DMRecommendation_status_idx" ON "DMRecommendation"("status");

-- CreateIndex
CREATE INDEX "DMRecommendation_priority_idx" ON "DMRecommendation"("priority");

-- CreateIndex
CREATE INDEX "DMRecommendation_type_idx" ON "DMRecommendation"("type");

-- CreateIndex
CREATE INDEX "DMRecommendation_createdAt_idx" ON "DMRecommendation"("createdAt");
