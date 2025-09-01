-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  ruolo TEXT NOT NULL CHECK (ruolo IN ('commerciale', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add user_id to existing tables to link them to users
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Update RLS policies for existing tables to filter by user_id
-- Clients policies
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable update for users based on email" ON clients;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON clients;

CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Deals policies
DROP POLICY IF EXISTS "Enable read access for all users" ON deals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON deals;
DROP POLICY IF EXISTS "Enable update for users based on email" ON deals;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON deals;

CREATE POLICY "Users can view their own deals" ON deals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deals" ON deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals" ON deals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals" ON deals
  FOR DELETE USING (auth.uid() = user_id);

-- Activities policies
DROP POLICY IF EXISTS "Enable read access for all users" ON activities;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON activities;
DROP POLICY IF EXISTS "Enable update for users based on email" ON activities;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON activities;

CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);