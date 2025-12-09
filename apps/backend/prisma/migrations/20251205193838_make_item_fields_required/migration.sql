/*
  Warnings:

  - Made the column `plate` on table `item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `brand` on table `item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `legal_status` on table `item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `basePrice` on table `item` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."item" ALTER COLUMN "plate" SET NOT NULL,
ALTER COLUMN "brand" SET NOT NULL,
ALTER COLUMN "legal_status" SET NOT NULL,
ALTER COLUMN "legal_status" SET DEFAULT 'TRANSFERIBLE',
ALTER COLUMN "basePrice" SET NOT NULL;
