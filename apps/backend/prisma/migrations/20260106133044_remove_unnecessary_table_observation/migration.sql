/*
  Warnings:

  - You are about to drop the `observation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."observation" DROP CONSTRAINT "observation_tenantId_fkey";

-- DropTable
DROP TABLE "public"."observation";
