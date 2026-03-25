-- Create portfolio table for tracking stock holdings
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  shares DECIMAL(18, 4) NOT NULL DEFAULT 0,
  avg_price DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_ticker ON portfolio(ticker);

-- Enable Row Level Security
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own portfolio
CREATE POLICY "Users can view their own portfolio"
  ON portfolio FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own portfolio items
CREATE POLICY "Users can insert their own portfolio items"
  ON portfolio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own portfolio items
CREATE POLICY "Users can update their own portfolio items"
  ON portfolio FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: users can delete their own portfolio items
CREATE POLICY "Users can delete their own portfolio items"
  ON portfolio FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
