import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709123456789 implements MigrationInterface {
  name = 'InitialSchema1709123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM ('CUSTOMER', 'MERCHANT', 'ADMIN', 'SUPPORT');
      CREATE TYPE "public"."account_status_enum" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'CLOSED');
      CREATE TYPE "public"."virtual_account_provider_enum" AS ENUM ('ezpg', 'daesun');
      CREATE TYPE "public"."transaction_type_enum" AS ENUM ('DEPOSIT', 'WITHDRAWAL');
      CREATE TYPE "public"."transaction_status_enum" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
      CREATE TYPE "public"."ticket_status_enum" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
      CREATE TYPE "public"."ticket_priority_enum" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "public"."user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "name" character varying NOT NULL,
        "phone" character varying,
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'CUSTOMER',
        "status" "public"."account_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"),
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
      )
    `);

    // Create virtual_accounts table
    await queryRunner.query(`
      CREATE TABLE "public"."virtual_account" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "merchantId" uuid NOT NULL,
        "provider" "public"."virtual_account_provider_enum" NOT NULL,
        "bankCd" character varying NOT NULL,
        "accountNo" character varying NOT NULL,
        "accountName" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "providerReferenceId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_virtual_account_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_virtual_account_user" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_virtual_account_merchant" FOREIGN KEY ("merchantId") REFERENCES "public"."user"("id") ON DELETE CASCADE
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "public"."transaction" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "virtualAccountId" uuid NOT NULL,
        "type" "public"."transaction_type_enum" NOT NULL,
        "amount" decimal(12,0) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'KRW',
        "status" "public"."transaction_status_enum" NOT NULL DEFAULT 'PENDING',
        "providerReferenceId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transaction_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transaction_user" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transaction_virtual_account" FOREIGN KEY ("virtualAccountId") REFERENCES "public"."virtual_account"("id") ON DELETE CASCADE
      )
    `);

    // Create points table
    await queryRunner.query(`
      CREATE TABLE "public"."point" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "merchantId" uuid NOT NULL,
        "balance" decimal(12,0) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_point_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_point_user" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_point_merchant" FOREIGN KEY ("merchantId") REFERENCES "public"."user"("id") ON DELETE CASCADE
      )
    `);

    // Create support_tickets table
    await queryRunner.query(`
      CREATE TABLE "public"."support_ticket" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "assignedToId" uuid,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "status" "public"."ticket_status_enum" NOT NULL DEFAULT 'OPEN',
        "priority" "public"."ticket_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_support_ticket_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_support_ticket_user" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_support_ticket_assigned_to" FOREIGN KEY ("assignedToId") REFERENCES "public"."user"("id") ON DELETE SET NULL
      )
    `);

    // Create ticket_comments table
    await queryRunner.query(`
      CREATE TABLE "public"."ticket_comment" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticketId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_comment_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ticket_comment_ticket" FOREIGN KEY ("ticketId") REFERENCES "public"."support_ticket"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ticket_comment_user" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_virtual_account_user" ON "public"."virtual_account"("userId");
      CREATE INDEX "IDX_virtual_account_merchant" ON "public"."virtual_account"("merchantId");
      CREATE INDEX "IDX_transaction_user" ON "public"."transaction"("userId");
      CREATE INDEX "IDX_transaction_virtual_account" ON "public"."transaction"("virtualAccountId");
      CREATE INDEX "IDX_point_user" ON "public"."point"("userId");
      CREATE INDEX "IDX_point_merchant" ON "public"."point"("merchantId");
      CREATE INDEX "IDX_support_ticket_user" ON "public"."support_ticket"("userId");
      CREATE INDEX "IDX_support_ticket_assigned_to" ON "public"."support_ticket"("assignedToId");
      CREATE INDEX "IDX_ticket_comment_ticket" ON "public"."ticket_comment"("ticketId");
      CREATE INDEX "IDX_ticket_comment_user" ON "public"."ticket_comment"("userId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_ticket_comment_user"`);
    await queryRunner.query(`DROP INDEX "IDX_ticket_comment_ticket"`);
    await queryRunner.query(`DROP INDEX "IDX_support_ticket_assigned_to"`);
    await queryRunner.query(`DROP INDEX "IDX_support_ticket_user"`);
    await queryRunner.query(`DROP INDEX "IDX_point_merchant"`);
    await queryRunner.query(`DROP INDEX "IDX_point_user"`);
    await queryRunner.query(`DROP INDEX "IDX_transaction_virtual_account"`);
    await queryRunner.query(`DROP INDEX "IDX_transaction_user"`);
    await queryRunner.query(`DROP INDEX "IDX_virtual_account_merchant"`);
    await queryRunner.query(`DROP INDEX "IDX_virtual_account_user"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "public"."ticket_comment"`);
    await queryRunner.query(`DROP TABLE "public"."support_ticket"`);
    await queryRunner.query(`DROP TABLE "public"."point"`);
    await queryRunner.query(`DROP TABLE "public"."transaction"`);
    await queryRunner.query(`DROP TABLE "public"."virtual_account"`);
    await queryRunner.query(`DROP TABLE "public"."user"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."ticket_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ticket_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."virtual_account_provider_enum"`);
    await queryRunner.query(`DROP TYPE "public"."account_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
