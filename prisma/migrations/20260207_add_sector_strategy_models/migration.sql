-- CreateEnum
CREATE TYPE "GradeLetter" AS ENUM ('A', 'A-', 'B', 'B-', 'C', 'D', 'F');

-- CreateTable
CREATE TABLE "sector_opportunities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "section_1" TEXT NOT NULL DEFAULT '',
    "section_2" TEXT NOT NULL DEFAULT '',
    "section_3" TEXT NOT NULL DEFAULT '',
    "section_4" TEXT NOT NULL DEFAULT '',
    "section_5" TEXT NOT NULL DEFAULT '',
    "section_6" TEXT NOT NULL DEFAULT '',
    "section_7" TEXT NOT NULL DEFAULT '',
    "section_8" TEXT NOT NULL DEFAULT '',
    "section_9" TEXT NOT NULL DEFAULT '',
    "section_10" TEXT NOT NULL DEFAULT '',
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sector_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_development_strategies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'sector_development_strategy',
    "source_document" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "component_1" TEXT NOT NULL DEFAULT '',
    "component_2" TEXT NOT NULL DEFAULT '',
    "component_3" TEXT NOT NULL DEFAULT '',
    "component_4" TEXT NOT NULL DEFAULT '',
    "component_5" TEXT NOT NULL DEFAULT '',
    "component_6" TEXT NOT NULL DEFAULT '',
    "selection_logic_adjacent_def" TEXT,
    "selection_logic_growth_def" TEXT,
    "selection_criteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cross_cutting_themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stakeholder_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sector_development_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategy_sector_opportunities" (
    "strategy_id" TEXT NOT NULL,
    "sector_opportunity_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "strategy_sector_opportunities_pkey" PRIMARY KEY ("strategy_id","sector_opportunity_id")
);

-- CreateTable
CREATE TABLE "strategy_grades" (
    "id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "grade_letter" "GradeLetter" NOT NULL,
    "grade_rationale_short" TEXT NOT NULL DEFAULT '',
    "evidence_comp_1" TEXT,
    "evidence_comp_2" TEXT,
    "evidence_comp_3" TEXT,
    "evidence_comp_4" TEXT,
    "evidence_comp_5" TEXT,
    "evidence_comp_6" TEXT,
    "missing_elements" TEXT NOT NULL DEFAULT '[]',
    "scope_discipline_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strategy_grades_strategy_id_key" ON "strategy_grades"("strategy_id");

-- AddForeignKey
ALTER TABLE "strategy_sector_opportunities" ADD CONSTRAINT "strategy_sector_opportunities_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "sector_development_strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_sector_opportunities" ADD CONSTRAINT "strategy_sector_opportunities_sector_opportunity_id_fkey" FOREIGN KEY ("sector_opportunity_id") REFERENCES "sector_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategy_grades" ADD CONSTRAINT "strategy_grades_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "sector_development_strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
