/*
  Adds:
  - tenant.isBlocked (ADMIN can block a tenant)
  - auction_item.startTime / auction_item.endTime (independent per-item countdown)

  Backfill:
  - Copy auction.startTime / auction.endTime into existing auction_item rows
*/

-- AlterTable
ALTER TABLE "public"."tenant" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."auction_item" ADD COLUMN "startTime" TIMESTAMP(3);
ALTER TABLE "public"."auction_item" ADD COLUMN "endTime" TIMESTAMP(3);

-- Backfill existing rows: inherit auction's times
UPDATE "public"."auction_item" ai
SET "startTime" = a."startTime",
    "endTime"   = a."endTime"
FROM "public"."auction" a
WHERE ai."auctionId" = a."id"
  AND (ai."startTime" IS NULL OR ai."endTime" IS NULL);
