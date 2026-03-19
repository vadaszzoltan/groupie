-- CreateEnum
CREATE TYPE "SourcePlatform" AS ENUM ('facebook_group');
CREATE TYPE "LabelState" AS ENUM ('unreviewed', 'relevant', 'not_relevant');
CREATE TYPE "TriggerType" AS ENUM ('manual', 'scheduled');
CREATE TYPE "ScrapeRunStatus" AS ENUM ('pending', 'running', 'success', 'failed', 'partial_success');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "apifyToken" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Source" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "platform" "SourcePlatform" NOT NULL DEFAULT 'facebook_group',
  "groupUrl" TEXT NOT NULL,
  "groupExternalId" TEXT,
  "actorId" TEXT NOT NULL,
  "actorInputJson" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSuccessfulRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Source_userId_isActive_idx" ON "Source"("userId", "isActive");

CREATE TABLE "ScrapeRun" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "sourceId" TEXT,
  "triggerType" "TriggerType" NOT NULL,
  "apifyRunId" TEXT,
  "status" "ScrapeRunStatus" NOT NULL DEFAULT 'pending',
  "fetchedCount" INTEGER NOT NULL DEFAULT 0,
  "insertedCount" INTEGER NOT NULL DEFAULT 0,
  "duplicateCount" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScrapeRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ScrapeRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ScrapeRun_userId_createdAt_idx" ON "ScrapeRun"("userId", "createdAt");

CREATE TABLE "Post" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "externalPostId" TEXT,
  "postUrl" TEXT NOT NULL,
  "authorName" TEXT,
  "contentText" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawPayloadJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Post_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Post_userId_sourceId_publishedAt_idx" ON "Post"("userId", "sourceId", "publishedAt");
CREATE UNIQUE INDEX "post_source_external_unique" ON "Post"("sourceId", "externalPostId");
CREATE UNIQUE INDEX "post_source_url_unique" ON "Post"("sourceId", "postUrl");
CREATE UNIQUE INDEX "post_source_hash_published_unique" ON "Post"("sourceId", "contentHash", "publishedAt");

CREATE TABLE "PostLabel" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "label" "LabelState" NOT NULL DEFAULT 'unreviewed',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostLabel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PostLabel_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PostLabel_postId_key" ON "PostLabel"("postId");

CREATE TABLE "PostLabelEvent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "label" "LabelState" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostLabelEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PostLabelEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PostLabelEvent_userId_postId_createdAt_idx" ON "PostLabelEvent"("userId", "postId", "createdAt");

CREATE TABLE "PostDraft" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PostDraft_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PostDraft_postId_key" ON "PostDraft"("postId");
