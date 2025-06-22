import { MigrationInterface, QueryRunner } from "typeorm";

export class DataBaseInit1750550653251 implements MigrationInterface {
    name = 'DataBaseInit1750550653251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "domain" character varying NOT NULL, CONSTRAINT "UQ_97b9c4dae58b30f5bd875f241ab" UNIQUE ("domain"), CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "logo" character varying, "principal_color" character varying, "principal_color2" character varying, "secondary_color" character varying, "secondary_color2" character varying, "secondary_color3" character varying, "tenantId" uuid NOT NULL, CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_106fcf465bed04b3aaec8fb279" ON "company" ("name", "tenantId") WHERE "isDeleted" IS FALSE`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "name" character varying, "email" character varying NOT NULL, "phone" character varying, "password" character varying NOT NULL, "rut" character varying, "public_name" character varying, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "tenantId" uuid NOT NULL, "companyId" uuid, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_435c1638210114b27fd375d37e" ON "user" ("rut") WHERE "isDeleted" IS TRUE`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_23cb9d3ddce75a59880bcfa94d" ON "user" ("email") WHERE "isDeleted" IS TRUE`);
        await queryRunner.query(`CREATE TABLE "auction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "public_id" character varying NOT NULL, "name" character varying NOT NULL, "start" TIMESTAMP NOT NULL DEFAULT now(), "end" TIMESTAMP, "state" "public"."auction_state_enum" NOT NULL DEFAULT 'active', "type" "public"."auction_type_enum" NOT NULL DEFAULT 'real', "tenantId" uuid NOT NULL, CONSTRAINT "PK_9dc876c629273e71646cf6dfa67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "plate" character varying, "brand" character varying, "model" character varying, "year" integer, "version" character varying, "photos" character varying, "docs" character varying, "kilometraje" integer, "legal_status" character varying, "state" character varying NOT NULL DEFAULT 'Disponible', "tenantId" uuid NOT NULL, CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auction_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "state" "public"."auction_item_state_enum" NOT NULL DEFAULT 'Disponible', "start_price" integer NOT NULL, "actual_price" integer NOT NULL, "selled_price" integer, "selled_date" TIMESTAMP, "tenantId" uuid NOT NULL, "auctionId" uuid NOT NULL, "itemId" uuid NOT NULL, CONSTRAINT "PK_27c3c60778327d48b589190ab20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bid" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "offered_price" integer NOT NULL, "bid_time" TIMESTAMP NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "auctionItemId" uuid NOT NULL, CONSTRAINT "PK_ed405dda320051aca2dcb1a50bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "observation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "description" character varying NOT NULL, "tenantId" uuid NOT NULL, CONSTRAINT "PK_77a736edc631a400b788ce302cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "entity" character varying NOT NULL, "entity_id" character varying NOT NULL, "action" "public"."audit_log_action_enum" NOT NULL DEFAULT 'create', "changes" json NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "auction_id" character varying NOT NULL, "auction_item_id" character varying NOT NULL, "observation_id" character varying NOT NULL, "bid_id" character varying NOT NULL, "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_3eb2fdec484e573c795ea379403" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_685bf353c85f23b6f848e4dcded" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_86586021a26d1180b0968f98502" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auction" ADD CONSTRAINT "FK_13c49647f9db0763901fd6e6a26" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "FK_3d03c38cd1823642616862541c3" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auction_item" ADD CONSTRAINT "FK_31586b8ed365c1ec70acf1a9c1d" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auction_item" ADD CONSTRAINT "FK_545f1923d0aedebab513794cc13" FOREIGN KEY ("auctionId") REFERENCES "auction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auction_item" ADD CONSTRAINT "FK_5be0457a800822a8e61d0afc1c8" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bid" ADD CONSTRAINT "FK_9d85ebb24e69d6dd3a9df897f2d" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bid" ADD CONSTRAINT "FK_b0f254bd6d29d3da2b6a8af262b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bid" ADD CONSTRAINT "FK_733b44330c630550e6b88e845cd" FOREIGN KEY ("auctionItemId") REFERENCES "auction_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "observation" ADD CONSTRAINT "FK_ab066b1acc3f115147b074943c0" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD CONSTRAINT "FK_4167b21288ab6e16239cb1d5016" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD CONSTRAINT "FK_2621409ebc295c5da7ff3e41396" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_log" DROP CONSTRAINT "FK_2621409ebc295c5da7ff3e41396"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP CONSTRAINT "FK_4167b21288ab6e16239cb1d5016"`);
        await queryRunner.query(`ALTER TABLE "observation" DROP CONSTRAINT "FK_ab066b1acc3f115147b074943c0"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP CONSTRAINT "FK_733b44330c630550e6b88e845cd"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP CONSTRAINT "FK_b0f254bd6d29d3da2b6a8af262b"`);
        await queryRunner.query(`ALTER TABLE "bid" DROP CONSTRAINT "FK_9d85ebb24e69d6dd3a9df897f2d"`);
        await queryRunner.query(`ALTER TABLE "auction_item" DROP CONSTRAINT "FK_5be0457a800822a8e61d0afc1c8"`);
        await queryRunner.query(`ALTER TABLE "auction_item" DROP CONSTRAINT "FK_545f1923d0aedebab513794cc13"`);
        await queryRunner.query(`ALTER TABLE "auction_item" DROP CONSTRAINT "FK_31586b8ed365c1ec70acf1a9c1d"`);
        await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_3d03c38cd1823642616862541c3"`);
        await queryRunner.query(`ALTER TABLE "auction" DROP CONSTRAINT "FK_13c49647f9db0763901fd6e6a26"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_86586021a26d1180b0968f98502"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_685bf353c85f23b6f848e4dcded"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_3eb2fdec484e573c795ea379403"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`DROP TABLE "observation"`);
        await queryRunner.query(`DROP TABLE "bid"`);
        await queryRunner.query(`DROP TABLE "auction_item"`);
        await queryRunner.query(`DROP TABLE "item"`);
        await queryRunner.query(`DROP TABLE "auction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23cb9d3ddce75a59880bcfa94d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_435c1638210114b27fd375d37e"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_106fcf465bed04b3aaec8fb279"`);
        await queryRunner.query(`DROP TABLE "company"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
    }

}
