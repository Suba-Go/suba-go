-- CreateEnum
CREATE TYPE "public"."user_role_enum" AS ENUM ('ADMIN', 'USER', 'AUCTION_MANAGER');

-- CreateEnum
CREATE TYPE "public"."item_state_enum" AS ENUM ('DISPONIBLE', 'EN_SUBASTA', 'VENDIDO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "public"."auction_status_enum" AS ENUM ('PENDIENTE', 'ACTIVA', 'COMPLETADA', 'CANCELADA', 'ELIMINADA');

-- CreateEnum
CREATE TYPE "public"."legal_status_enum" AS ENUM ('TRANSFERIBLE', 'LEASING', 'POSIBILIDAD_DE_EMBARGO', 'PRENDA', 'OTRO');

-- CreateEnum
CREATE TYPE "public"."auction_type_enum" AS ENUM ('TEST', 'REAL');

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "rut" TEXT,
    "public_name" TEXT,
    "role" "public"."user_role_enum" NOT NULL DEFAULT 'AUCTION_MANAGER',
    "tenantId" TEXT,
    "companyId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "nameLowercase" TEXT NOT NULL,
    "logo" TEXT,
    "principal_color" TEXT,
    "principal_color2" TEXT,
    "secondary_color" TEXT,
    "secondary_color2" TEXT,
    "secondary_color3" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "plate" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "version" TEXT,
    "photos" TEXT,
    "docs" TEXT,
    "kilometraje" INTEGER,
    "legal_status" "public"."legal_status_enum",
    "state" "public"."item_state_enum" NOT NULL DEFAULT 'DISPONIBLE',
    "basePrice" INTEGER,
    "description" TEXT,
    "soldPrice" INTEGER,
    "soldAt" TIMESTAMP(3),
    "soldToUserId" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "public"."auction_status_enum" NOT NULL DEFAULT 'PENDIENTE',
    "type" "public"."auction_type_enum" NOT NULL DEFAULT 'REAL',
    "bidIncrement" INTEGER NOT NULL DEFAULT 50000,
    "itemIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auction_item" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "startingBid" INTEGER NOT NULL,
    "auctionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "auction_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auction_registration" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,

    CONSTRAINT "auction_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bid" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "offered_price" INTEGER NOT NULL,
    "bid_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "auctionItemId" TEXT NOT NULL,

    CONSTRAINT "bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."observation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "userId" TEXT,
    "tenantId" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IDX_user_email_unique" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_user_rut_unique" ON "public"."user"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "company_name_key" ON "public"."company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "company_nameLowercase_key" ON "public"."company"("nameLowercase");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_company_name_tenant_unique" ON "public"."company"("name", "tenantId");

-- CreateIndex
CREATE INDEX "item_soldToUserId_idx" ON "public"."item"("soldToUserId");

-- CreateIndex
CREATE INDEX "auction_tenantId_status_idx" ON "public"."auction"("tenantId", "status");

-- CreateIndex
CREATE INDEX "auction_startTime_endTime_idx" ON "public"."auction"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "auction_registration_auctionId_idx" ON "public"."auction_registration"("auctionId");

-- CreateIndex
CREATE INDEX "auction_registration_userId_idx" ON "public"."auction_registration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auction_registration_userId_auctionId_key" ON "public"."auction_registration"("userId", "auctionId");

-- CreateIndex
CREATE UNIQUE INDEX "bid_requestId_key" ON "public"."bid"("requestId");

-- CreateIndex
CREATE INDEX "bid_auctionItemId_offered_price_idx" ON "public"."bid"("auctionItemId", "offered_price" DESC);

-- CreateIndex
CREATE INDEX "bid_auctionId_createdAt_idx" ON "public"."bid"("auctionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "bid_userId_createdAt_idx" ON "public"."bid"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "public"."audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_tenantId_idx" ON "public"."audit_log"("tenantId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "public"."audit_log"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company" ADD CONSTRAINT "company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item" ADD CONSTRAINT "item_soldToUserId_fkey" FOREIGN KEY ("soldToUserId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item" ADD CONSTRAINT "item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auction" ADD CONSTRAINT "auction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auction_item" ADD CONSTRAINT "auction_item_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "public"."auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auction_item" ADD CONSTRAINT "auction_item_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auction_registration" ADD CONSTRAINT "auction_registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auction_registration" ADD CONSTRAINT "auction_registration_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "public"."auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bid" ADD CONSTRAINT "bid_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bid" ADD CONSTRAINT "bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bid" ADD CONSTRAINT "bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "public"."auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bid" ADD CONSTRAINT "bid_auctionItemId_fkey" FOREIGN KEY ("auctionItemId") REFERENCES "public"."auction_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."observation" ADD CONSTRAINT "observation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
