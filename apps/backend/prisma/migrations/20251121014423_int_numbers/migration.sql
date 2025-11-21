/*
  Warnings:

  - You are about to alter the column `bidIncrement` on the `auction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `startingBid` on the `auction_item` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `offered_price` on the `bid` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `basePrice` on the `item` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `soldPrice` on the `item` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."auction" ADD COLUMN     "itemIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "bidIncrement" SET DEFAULT 50000,
ALTER COLUMN "bidIncrement" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."auction_item" ALTER COLUMN "startingBid" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."bid" ALTER COLUMN "offered_price" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."item" ADD COLUMN     "description" TEXT,
ALTER COLUMN "basePrice" SET DATA TYPE INTEGER,
ALTER COLUMN "soldPrice" SET DATA TYPE INTEGER;
