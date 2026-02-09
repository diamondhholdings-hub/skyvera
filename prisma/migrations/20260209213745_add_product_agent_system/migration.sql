-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerName" TEXT NOT NULL,
    "bu" TEXT NOT NULL,
    "rr" REAL NOT NULL,
    "nrr" REAL NOT NULL,
    "totalRevenue" REAL NOT NULL,
    "rank" INTEGER,
    "pctOfTotal" REAL,
    "healthScore" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "subId" REAL,
    "arr" REAL,
    "renewalQtr" TEXT,
    "willRenew" TEXT,
    "projectedArr" REAL,
    CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bu" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "totalRR" REAL NOT NULL,
    "totalNRR" REAL NOT NULL,
    "totalRevenue" REAL NOT NULL,
    "grossMargin" REAL NOT NULL,
    "netMargin" REAL NOT NULL,
    "ebitda" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sentiment" TEXT,
    "relevanceScore" REAL,
    "fetchedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CacheEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerName_key" ON "Customer"("customerName");

-- CreateIndex
CREATE INDEX "Customer_bu_idx" ON "Customer"("bu");

-- CreateIndex
CREATE INDEX "Customer_customerName_idx" ON "Customer"("customerName");

-- CreateIndex
CREATE INDEX "Subscription_customerId_idx" ON "Subscription"("customerId");

-- CreateIndex
CREATE INDEX "FinancialSnapshot_bu_idx" ON "FinancialSnapshot"("bu");

-- CreateIndex
CREATE INDEX "FinancialSnapshot_quarter_idx" ON "FinancialSnapshot"("quarter");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialSnapshot_bu_quarter_key" ON "FinancialSnapshot"("bu", "quarter");

-- CreateIndex
CREATE INDEX "NewsArticle_customerName_idx" ON "NewsArticle"("customerName");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CacheEntry_key_key" ON "CacheEntry"("key");

-- CreateIndex
CREATE INDEX "CacheEntry_expiresAt_idx" ON "CacheEntry"("expiresAt");
