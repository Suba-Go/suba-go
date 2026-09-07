-- One-time, idempotent unblock for the `20260907190000_add_vehicle_lot_support`
-- migration.
--
-- Context: on an environment that had a soft-deleted item and an active item
-- sharing a plate within the same tenant, the first attempt of this migration
-- failed while creating the unique index and was recorded as FAILED (Postgres
-- rolled the migration back in its transaction, so no schema changes remain).
-- Prisma then refuses to apply any further migrations (error P3009).
--
-- The migration itself is now self-healing (it renames the soft-deleted
-- duplicates before creating the index), so we just need to clear the failed
-- record so `prisma migrate deploy` re-applies it.
--
-- This is safe to run on EVERY deploy and in EVERY environment:
--   * It only matches THIS migration name.
--   * It only deletes the row when `finished_at IS NULL` (i.e. still failed).
--     On environments where the migration already succeeded, `finished_at` is
--     set, so nothing is deleted and this is a no-op.
DELETE FROM "_prisma_migrations"
WHERE "migration_name" = '20260907190000_add_vehicle_lot_support'
  AND "finished_at" IS NULL;
