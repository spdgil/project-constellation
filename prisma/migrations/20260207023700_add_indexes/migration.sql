-- Add indexes for frequently filtered/queried columns
-- See: Code Health Assessment — Performance pillar, item #3

-- Deal filtering indexes
CREATE INDEX IF NOT EXISTS "deals_readiness_state_idx" ON "deals"("readiness_state");
CREATE INDEX IF NOT EXISTS "deals_dominant_constraint_idx" ON "deals"("dominant_constraint");

-- LGA name index (sorting/filtering)
CREATE INDEX IF NOT EXISTS "lgas_name_idx" ON "lgas"("name");

-- Foreign key indexes on child tables (speeds up JOIN and CASCADE)
CREATE INDEX IF NOT EXISTS "lga_opportunity_hypotheses_lga_id_idx" ON "lga_opportunity_hypotheses"("lga_id");
CREATE INDEX IF NOT EXISTS "deal_evidence_deal_id_idx" ON "deal_evidence"("deal_id");
CREATE INDEX IF NOT EXISTS "deal_government_programs_deal_id_idx" ON "deal_government_programs"("deal_id");
CREATE INDEX IF NOT EXISTS "deal_timeline_milestones_deal_id_idx" ON "deal_timeline_milestones"("deal_id");
