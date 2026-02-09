-- CreateTable
CREATE TABLE "PRD" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prdId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "priorityScore" INTEGER NOT NULL,
    "priorityClass" TEXT NOT NULL,
    "leverageClassification" TEXT NOT NULL,
    "arrImpact" REAL NOT NULL,
    "customerCount" INTEGER NOT NULL,
    "implementationWeeks" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "workflowId" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "approvedAt" DATETIME,
    "shippedAt" DATETIME,
    "assignedPm" TEXT,
    "assignedEngLead" TEXT,
    "reviewedBy" TEXT,
    "approvedBy" TEXT,
    "strategicThemes" TEXT,
    "businessUnits" TEXT,
    "customerTags" TEXT,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "FeatureRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerArr" REAL NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "featureDescription" TEXT NOT NULL,
    "customerQuote" TEXT,
    "urgency" TEXT NOT NULL,
    "dealImpact" TEXT NOT NULL,
    "dealSize" REAL,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "linkedPrdId" TEXT,
    "processedAt" DATETIME,
    "patternId" TEXT,
    CONSTRAINT "FeatureRequest_linkedPrdId_fkey" FOREIGN KEY ("linkedPrdId") REFERENCES "PRD" ("prdId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patternId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "customers" TEXT NOT NULL,
    "arrAtRisk" REAL,
    "arrOpportunity" REAL,
    "financialImpact" REAL,
    "status" TEXT NOT NULL,
    "prdGenerated" BOOLEAN NOT NULL DEFAULT false,
    "linkedPrdId" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workflowId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentStage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "input" TEXT,
    "output" TEXT,
    "error" TEXT,
    "executionTimeMs" INTEGER,
    "tokensUsed" INTEGER,
    "costUsd" REAL
);

-- CreateTable
CREATE TABLE "PRDLifecycle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prdId" TEXT NOT NULL,
    "predictedArrImpact" REAL NOT NULL,
    "predictedCustomers" INTEGER NOT NULL,
    "predictedWeeks" INTEGER NOT NULL,
    "reviewDecision" TEXT,
    "reviewFeedback" TEXT,
    "pmPriorityOverride" INTEGER,
    "devStartedAt" DATETIME,
    "actualWeeks" INTEGER,
    "actualArrImpact30d" REAL,
    "actualArrImpact90d" REAL,
    "actualCustomerAdoption" INTEGER,
    "customerSatisfaction" REAL,
    "predictionAccuracy" REAL,
    "leverageValidated" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PRDLifecycle_prdId_fkey" FOREIGN KEY ("prdId") REFERENCES "PRD" ("prdId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PRD_prdId_key" ON "PRD"("prdId");

-- CreateIndex
CREATE INDEX "PRD_prdId_idx" ON "PRD"("prdId");

-- CreateIndex
CREATE INDEX "PRD_status_idx" ON "PRD"("status");

-- CreateIndex
CREATE INDEX "PRD_priorityClass_idx" ON "PRD"("priorityClass");

-- CreateIndex
CREATE INDEX "PRD_generatedAt_idx" ON "PRD"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureRequest_requestId_key" ON "FeatureRequest"("requestId");

-- CreateIndex
CREATE INDEX "FeatureRequest_customerName_idx" ON "FeatureRequest"("customerName");

-- CreateIndex
CREATE INDEX "FeatureRequest_status_idx" ON "FeatureRequest"("status");

-- CreateIndex
CREATE INDEX "FeatureRequest_submittedAt_idx" ON "FeatureRequest"("submittedAt");

-- CreateIndex
CREATE INDEX "FeatureRequest_patternId_idx" ON "FeatureRequest"("patternId");

-- CreateIndex
CREATE UNIQUE INDEX "Pattern_patternId_key" ON "Pattern"("patternId");

-- CreateIndex
CREATE INDEX "Pattern_patternId_idx" ON "Pattern"("patternId");

-- CreateIndex
CREATE INDEX "Pattern_status_idx" ON "Pattern"("status");

-- CreateIndex
CREATE INDEX "Pattern_detectedAt_idx" ON "Pattern"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_workflowId_key" ON "Workflow"("workflowId");

-- CreateIndex
CREATE INDEX "Workflow_workflowId_idx" ON "Workflow"("workflowId");

-- CreateIndex
CREATE INDEX "Workflow_status_idx" ON "Workflow"("status");

-- CreateIndex
CREATE INDEX "Workflow_startedAt_idx" ON "Workflow"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PRDLifecycle_prdId_key" ON "PRDLifecycle"("prdId");

-- CreateIndex
CREATE INDEX "PRDLifecycle_prdId_idx" ON "PRDLifecycle"("prdId");
