-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('definition', 'pre-feasibility', 'feasibility', 'structuring', 'transaction-close');

-- CreateEnum
CREATE TYPE "ReadinessState" AS ENUM ('no-viable-projects', 'conceptual-interest', 'feasibility-underway', 'structurable-but-stalled', 'investable-with-minor-intervention', 'scaled-and-replicable');

-- CreateEnum
CREATE TYPE "Constraint" AS ENUM ('revenue-certainty', 'offtake-demand-aggregation', 'planning-and-approvals', 'sponsor-capability', 'early-risk-capital', 'balance-sheet-constraints', 'technology-risk', 'coordination-failure', 'skills-and-workforce-constraint', 'common-user-infrastructure-gap');

-- CreateEnum
CREATE TYPE "GateStatus" AS ENUM ('pending', 'satisfied', 'not-applicable');

-- CreateEnum
CREATE TYPE "ArtefactStatus" AS ENUM ('not-started', 'in-progress', 'complete');

-- CreateTable
CREATE TABLE "lgas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geometry_ref" TEXT NOT NULL,
    "summary" TEXT,
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "repeated_constraints" "Constraint"[],

    CONSTRAINT "lgas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_opportunity_hypotheses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "dominant_constraint" "Constraint",
    "lga_id" TEXT NOT NULL,

    CONSTRAINT "lga_opportunity_hypotheses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lga_evidence" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT,
    "page_ref" TEXT,
    "lga_id" TEXT NOT NULL,

    CONSTRAINT "lga_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" TEXT NOT NULL DEFAULT '',
    "economic_function" TEXT NOT NULL DEFAULT '',
    "typical_capital_stack" TEXT NOT NULL DEFAULT '',
    "typical_risks" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "opportunity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_lgas" (
    "deal_id" TEXT NOT NULL,
    "lga_id" TEXT NOT NULL,

    CONSTRAINT "deal_lgas_pkey" PRIMARY KEY ("deal_id","lga_id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "opportunity_type_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "stage" "DealStage" NOT NULL,
    "readiness_state" "ReadinessState" NOT NULL,
    "dominant_constraint" "Constraint" NOT NULL,
    "summary" TEXT NOT NULL,
    "next_step" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "investment_value" TEXT,
    "economic_impact" TEXT,
    "key_stakeholders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "risks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strategic_actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "infrastructure_needs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills_implications" TEXT,
    "market_drivers" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_evidence" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT,
    "page_ref" TEXT,
    "deal_id" TEXT NOT NULL,

    CONSTRAINT "deal_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deal_id" TEXT NOT NULL,

    CONSTRAINT "deal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_gate_entries" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL,
    "question" TEXT NOT NULL,
    "status" "GateStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "deal_gate_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_artefacts" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ArtefactStatus" NOT NULL DEFAULT 'not-started',
    "summary" TEXT,
    "url" TEXT,

    CONSTRAINT "deal_artefacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_government_programs" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "deal_government_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_timeline_milestones" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "date" TEXT,

    CONSTRAINT "deal_timeline_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_documents" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_data" BYTEA NOT NULL,
    "label" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constraint_events" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "dominant_constraint" "Constraint" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_reason" TEXT NOT NULL,

    CONSTRAINT "constraint_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deals_opportunity_type_id_idx" ON "deals"("opportunity_type_id");

-- CreateIndex
CREATE INDEX "deals_stage_idx" ON "deals"("stage");

-- CreateIndex
CREATE INDEX "deals_updated_at_idx" ON "deals"("updated_at");

-- CreateIndex
CREATE INDEX "deal_notes_deal_id_idx" ON "deal_notes"("deal_id");

-- CreateIndex
CREATE INDEX "deal_gate_entries_deal_id_stage_idx" ON "deal_gate_entries"("deal_id", "stage");

-- CreateIndex
CREATE INDEX "deal_artefacts_deal_id_stage_idx" ON "deal_artefacts"("deal_id", "stage");

-- CreateIndex
CREATE INDEX "deal_documents_deal_id_idx" ON "deal_documents"("deal_id");

-- CreateIndex
CREATE INDEX "constraint_events_entity_id_idx" ON "constraint_events"("entity_id");

-- CreateIndex
CREATE INDEX "constraint_events_changed_at_idx" ON "constraint_events"("changed_at");

-- AddForeignKey
ALTER TABLE "lga_opportunity_hypotheses" ADD CONSTRAINT "lga_opportunity_hypotheses_lga_id_fkey" FOREIGN KEY ("lga_id") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lga_evidence" ADD CONSTRAINT "lga_evidence_lga_id_fkey" FOREIGN KEY ("lga_id") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_lgas" ADD CONSTRAINT "deal_lgas_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_lgas" ADD CONSTRAINT "deal_lgas_lga_id_fkey" FOREIGN KEY ("lga_id") REFERENCES "lgas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_opportunity_type_id_fkey" FOREIGN KEY ("opportunity_type_id") REFERENCES "opportunity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_evidence" ADD CONSTRAINT "deal_evidence_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_notes" ADD CONSTRAINT "deal_notes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_gate_entries" ADD CONSTRAINT "deal_gate_entries_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_artefacts" ADD CONSTRAINT "deal_artefacts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_government_programs" ADD CONSTRAINT "deal_government_programs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_timeline_milestones" ADD CONSTRAINT "deal_timeline_milestones_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_documents" ADD CONSTRAINT "deal_documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constraint_events" ADD CONSTRAINT "constraint_events_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
