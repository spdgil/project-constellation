-- Split investmentValue/economicImpact string fields into structured numeric + description fields
-- AlterTable
ALTER TABLE "deals" DROP COLUMN "economic_impact",
DROP COLUMN "investment_value",
ADD COLUMN     "economic_impact_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "economic_impact_description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "economic_impact_jobs" INTEGER,
ADD COLUMN     "investment_value_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "investment_value_description" TEXT NOT NULL DEFAULT '';
