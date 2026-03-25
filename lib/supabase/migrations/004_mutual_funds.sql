-- Create mutual_funds table for tracking fund investments
CREATE TABLE IF NOT EXISTS mutual_funds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_name VARCHAR(255) NOT NULL,
  ticker VARCHAR(50),
  units DECIMAL(18, 4) NOT NULL DEFAULT 0,
  nav DECIMAL(18, 4) NOT NULL DEFAULT 0,
  purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mutual_funds_user_id ON mutual_funds(user_id);

-- Enable Row Level Security
ALTER TABLE mutual_funds ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own mutual funds"
  ON mutual_funds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mutual funds"
  ON mutual_funds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mutual funds"
  ON mutual_funds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mutual funds"
  ON mutual_funds FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_mutual_funds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_mutual_funds_updated_at
  BEFORE UPDATE ON mutual_funds
  FOR EACH ROW
  EXECUTE FUNCTION update_mutual_funds_updated_at();
