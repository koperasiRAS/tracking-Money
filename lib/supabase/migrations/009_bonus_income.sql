-- Create bonus_income_sources table for tracking income sources
CREATE TABLE IF NOT EXISTS bonus_income_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('salary_bonus', 'thr', 'rental', 'freelance', 'dividend', 'interest', 'royalty', 'side_hustle', 'other')),
  expected_amount DECIMAL(18, 2) DEFAULT 0,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'semiannual', 'annual', 'once')),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bonus_income_records table for tracking actual received bonuses
CREATE TABLE IF NOT EXISTS bonus_income_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES bonus_income_sources(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  received_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bonus_sources_user_id ON bonus_income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_sources_active ON bonus_income_sources(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_bonus_records_user_id ON bonus_income_records(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_records_date ON bonus_income_records(received_date);

-- Enable Row Level Security
ALTER TABLE bonus_income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bonus sources"
  ON bonus_income_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bonus sources"
  ON bonus_income_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bonus sources"
  ON bonus_income_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bonus sources"
  ON bonus_income_sources FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE bonus_income_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bonus records"
  ON bonus_income_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bonus records"
  ON bonus_income_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bonus records"
  ON bonus_income_records FOR DELETE
  USING (auth.uid() = user_id);
