/*
  Ensure an Item can belong to only one Auction at a time (enforced in service logic)
  and prevent duplicates inside the same auction by adding a unique constraint:

    auction_item (auctionId, itemId)

  NOTE: This migration removes accidental duplicates before creating the unique index.
*/

-- Deduplicate existing rows (keep the earliest createdAt; tie-breaker by id)
DELETE FROM "public"."auction_item" ai
USING "public"."auction_item" ai2
WHERE ai."auctionId" = ai2."auctionId"
  AND ai."itemId" = ai2."itemId"
  AND (
    ai."createdAt" > ai2."createdAt"
    OR (ai."createdAt" = ai2."createdAt" AND ai."id" > ai2."id")
  );

-- Add unique constraint (Prisma uses a unique index)
CREATE UNIQUE INDEX "auction_item_auctionId_itemId_key"
ON "public"."auction_item"("auctionId", "itemId");
