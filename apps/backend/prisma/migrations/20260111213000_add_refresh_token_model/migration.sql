/*
  Adds:
  - refresh_token table to support refresh-token rotation & multi-device sessions.

  Notes:
  - We never store raw refresh tokens in the database (only a one-way hash).
  - A refresh token can be revoked and optionally point to its replacement.
*/

-- CreateTable
CREATE TABLE "public"."refresh_token" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    "hashedToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByTokenId" TEXT,

    "userAgent" TEXT,
    "ip" TEXT,

    "userId" TEXT NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "refresh_token_userId_idx" ON "public"."refresh_token"("userId");
CREATE INDEX "refresh_token_expiresAt_idx" ON "public"."refresh_token"("expiresAt");
CREATE INDEX "refresh_token_hashedToken_idx" ON "public"."refresh_token"("hashedToken");
CREATE UNIQUE INDEX "refresh_token_replacedByTokenId_key" ON "public"."refresh_token"("replacedByTokenId");

-- Foreign keys
ALTER TABLE "public"."refresh_token" ADD CONSTRAINT "refresh_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."refresh_token" ADD CONSTRAINT "refresh_token_replacedByTokenId_fkey" FOREIGN KEY ("replacedByTokenId") REFERENCES "public"."refresh_token"("id") ON DELETE SET NULL ON UPDATE CASCADE;
