-- Rimuovi vincoli di autenticazione dalle tabelle principali
ALTER TABLE clients DROP COLUMN IF EXISTS user_id;
ALTER TABLE activities DROP COLUMN IF EXISTS user_id;
ALTER TABLE deals DROP COLUMN IF EXISTS user_id;

-- Rimuovi le politiche RLS se presenti
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;

-- Rimuovi eventuali politiche esistenti
DROP POLICY IF EXISTS "Users can only see their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only see their own activities" ON activities;
DROP POLICY IF EXISTS "Users can only see their own deals" ON deals;