/*
  Add multi-vehicle "lot" support.

  Until now an Item held the vehicle-identity fields directly (1 item = 1 car).
  This migration introduces a `vehicle` table so a single Item (a "lote") can
  group one or more vehicles under a single base price.

  Data is preserved: every existing item is converted into a lot containing
  exactly one vehicle (its current plate/brand/model/year/version/kilometraje),
  and only then are those columns dropped from `item`.

  Note: plate uniqueness (previously enforced in service logic, scoped by tenant)
  is now a real unique constraint on (plate, tenantId) in `vehicle`.
*/

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT,
    "year" INTEGER,
    "version" TEXT,
    "kilometraje" INTEGER,
    "itemId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- Backfill: one vehicle per existing item, copying the identity fields and
-- reusing the item's own timestamps and soft-delete flags.
INSERT INTO "vehicle" (
    "id", "createdAt", "updatedAt", "isDeleted", "deletedAt",
    "plate", "brand", "model", "year", "version", "kilometraje",
    "itemId", "tenantId"
)
SELECT
    gen_random_uuid(),
    "createdAt",
    "updatedAt",
    "isDeleted",
    "deletedAt",
    "plate",
    "brand",
    "model",
    "year",
    "version",
    "kilometraje",
    "id",
    "tenantId"
FROM "item";

-- CreateIndex
CREATE INDEX "vehicle_itemId_idx" ON "vehicle"("itemId");

-- CreateIndex
CREATE INDEX "vehicle_tenantId_idx" ON "vehicle"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_vehicle_plate_tenant_unique" ON "vehicle"("plate", "tenantId");

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: drop the columns now that the data lives in `vehicle`.
ALTER TABLE "item"
    DROP COLUMN "plate",
    DROP COLUMN "brand",
    DROP COLUMN "model",
    DROP COLUMN "year",
    DROP COLUMN "version",
    DROP COLUMN "kilometraje";
