-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "AuthOutcome" AS ENUM ('allowed', 'denied-not-allowlisted', 'denied-inactive', 'error');

-- AlterTable
ALTER TABLE "deal_documents" ALTER COLUMN "file_url" DROP DEFAULT;

-- AlterTable
ALTER TABLE "strategy_documents" ALTER COLUMN "file_url" DROP DEFAULT;

-- CreateTable
CREATE TABLE "allowed_emails" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allowed_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_audit_events" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "outcome" "AuthOutcome" NOT NULL,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allowed_emails_email_key" ON "allowed_emails"("email");

-- CreateIndex
CREATE INDEX "allowed_emails_email_idx" ON "allowed_emails"("email");

-- CreateIndex
CREATE INDEX "auth_audit_events_email_idx" ON "auth_audit_events"("email");

-- CreateIndex
CREATE INDEX "auth_audit_events_created_at_idx" ON "auth_audit_events"("created_at");

-- CreateIndex
CREATE INDEX "deal_lgas_lga_id_idx" ON "deal_lgas"("lga_id");

-- CreateIndex
CREATE INDEX "lga_evidence_lga_id_idx" ON "lga_evidence"("lga_id");
