-- Migration: Replace binary file storage with Vercel Blob URL references
-- DealDocument: drop file_data column, add file_url column
-- StrategyDocument: drop file_data column, add file_url column

-- Deal documents
ALTER TABLE "deal_documents" ADD COLUMN "file_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "deal_documents" DROP COLUMN "file_data";

-- Strategy documents
ALTER TABLE "strategy_documents" ADD COLUMN "file_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "strategy_documents" DROP COLUMN "file_data";
