-- Create dividend_schedules table for storing expected dividend patterns per ticker
CREATE TABLE IF NOT EXISTS dividend_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  annual_yield_percent DECIMAL(8, 4) DEFAULT 0, -- e.g., 4.5 = 4.5%
  dividend_per_share DECIMAL(18, 4) DEFAULT 0, -- dividend per share in IDR
  frequency VARCHAR(20) DEFAULT 'quarterly' CHECK (frequency IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  next_ex_date DATE,
  next_pay_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Create dividend_records table for tracking actual dividends received
CREATE TABLE IF NOT EXISTS dividend_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  ex_date DATE NOT NULL,
  pay_date DATE,
  amount_per_share DECIMAL(18, 4) NOT NULL,
  total_received DECIMAL(18, 2), -- auto-calculated: amount_per_share * shares_owned
  shares_count INTEGER,
  currency VARCHAR(10) DEFAULT 'IDR',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dividend_schedules_user_id ON dividend_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_dividend_records_user_id ON dividend_records(user_id);
CREATE INDEX IF NOT EXISTS idx_dividend_records_ex_date ON dividend_records(ex_date);

-- Enable Row Level Security
ALTER TABLE dividend_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dividend schedules"
  ON dividend_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dividend schedules"
  ON dividend_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dividend schedules"
  ON dividend_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dividend schedules"
  ON dividend_schedules FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE dividend_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dividend records"
  ON dividend_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dividend records"
  ON dividend_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dividend records"
  ON dividend_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dividend records"
  ON dividend_records FOR DELETE
  USING (auth.uid() = user_id);
