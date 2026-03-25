-- Create dca_schedules table for recurring investment reminders
CREATE TABLE IF NOT EXISTS dca_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  amount DECIMAL(18, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered TIMESTAMP WITH TIME ZONE,
  next_due TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dca_user_id ON dca_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_dca_active ON dca_schedules(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_dca_next_due ON dca_schedules(next_due) WHERE is_active = TRUE;

-- Enable Row Level Security
ALTER TABLE dca_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own DCA schedules"
  ON dca_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DCA schedules"
  ON dca_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DCA schedules"
  ON dca_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DCA schedules"
  ON dca_schedules FOR DELETE
  USING (auth.uid() = user_id);
