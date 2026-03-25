-- Add alert_type and priority to alerts table for smart alerts
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS alert_type VARCHAR(20) DEFAULT 'default' CHECK (alert_type IN ('buy', 'avg_down', 'warning', 'default'));
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 3);

-- Add index for active alerts by type
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type) WHERE alert_type IS NOT NULL;

-- Update existing RLS policies (already covers user_id correctly, no changes needed)
