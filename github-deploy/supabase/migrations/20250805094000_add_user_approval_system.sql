-- Add approval system to users table
ALTER TABLE users ADD COLUMN approved BOOLEAN DEFAULT false;

-- Update ruolo enum to include 'owner'
ALTER TABLE users ALTER COLUMN ruolo TYPE TEXT;
ALTER TABLE users ADD CONSTRAINT users_ruolo_check CHECK (ruolo IN ('commerciale', 'manager', 'owner'));

-- Create default owner user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'info@ad-wonder.com',
  crypt('Braccioni005!', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Create corresponding profile for the owner
INSERT INTO users (id, email, nome, cognome, ruolo, approved, created_at)
SELECT 
  id,
  'info@ad-wonder.com',
  'Admin',
  'Owner',
  'owner',
  true,
  now()
FROM auth.users 
WHERE email = 'info@ad-wonder.com';

-- Update RLS policies to consider approval status
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- New policies that check both authentication and approval
CREATE POLICY "Approved users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id AND approved = true);

CREATE POLICY "Approved users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id AND approved = true);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Owner can view and manage all users
CREATE POLICY "Owner can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND ruolo = 'owner' 
      AND approved = true
    )
  );

CREATE POLICY "Owner can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND ruolo = 'owner' 
      AND approved = true
    )
  );

-- Update existing table policies to check approval status
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

CREATE POLICY "Approved users can view own clients" ON clients
  FOR SELECT USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can insert own clients" ON clients
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can update own clients" ON clients
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can delete own clients" ON clients
  FOR DELETE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

-- Update deals policies
DROP POLICY IF EXISTS "Users can view own deals" ON deals;
DROP POLICY IF EXISTS "Users can insert own deals" ON deals;
DROP POLICY IF EXISTS "Users can update own deals" ON deals;
DROP POLICY IF EXISTS "Users can delete own deals" ON deals;

CREATE POLICY "Approved users can view own deals" ON deals
  FOR SELECT USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can insert own deals" ON deals
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can update own deals" ON deals
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can delete own deals" ON deals
  FOR DELETE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

-- Update activities policies
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON activities;

CREATE POLICY "Approved users can view own activities" ON activities
  FOR SELECT USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can insert own activities" ON activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can update own activities" ON activities
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );

CREATE POLICY "Approved users can delete own activities" ON activities
  FOR DELETE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND approved = true)
  );