-- Add strategy upload support: status, extractedText, and StrategyDocument table

-- CreateEnum
CREATE TYPE "StrategyStatus" AS ENUM ('draft', 'published');

-- AlterTable: add status and extracted_text columns
ALTER TABLE "sector_development_strategies"
  ADD COLUMN "status" "StrategyStatus" NOT NULL DEFAULT 'published',
  ADD COLUMN "extracted_text" TEXT;

-- CreateIndex
CREATE INDEX "sector_development_strategies_status_idx"
  ON "sector_development_strategies"("status");

-- CreateTable
CREATE TABLE "strategy_documents" (
    "id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_data" BYTEA NOT NULL,
    "label" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "strategy_documents_strategy_id_idx"
  ON "strategy_documents"("strategy_id");

-- AddForeignKey
ALTER TABLE "strategy_documents"
  ADD CONSTRAINT "strategy_documents_strategy_id_fkey"
  FOREIGN KEY ("strategy_id") REFERENCES "sector_development_strategies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
