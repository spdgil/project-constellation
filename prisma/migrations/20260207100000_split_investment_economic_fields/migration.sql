-- No-op: the init migration (20260207023328_init) already creates the deals
-- table with the split columns (investment_value_amount, investment_value_description,
-- economic_impact_amount, economic_impact_description, economic_impact_jobs).
--
-- This migration was erroneously generated from local dev DB drift where the
-- old single-column schema existed. It is not needed in any environment.
SELECT 1;
