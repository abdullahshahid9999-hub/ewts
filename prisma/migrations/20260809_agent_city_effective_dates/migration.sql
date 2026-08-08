-- Agency city field
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agency_city TEXT;
-- Credit limit effective tracking
ALTER TABLE agents ADD COLUMN IF NOT EXISTS credit_limit_effective_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS credit_limit_updated_at TIMESTAMPTZ;
-- Commission effective date
ALTER TABLE agent_commission_rates ADD COLUMN IF NOT EXISTS effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
