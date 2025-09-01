/*
  # CRM Light Database Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `nome_azienda` (text, required)
      - `referente_principale` (text, required)
      - `email` (text, required)
      - `telefono` (text, required)
      - `settore` (text, required)
      - `stato` (enum: lead, prospect, cliente)
      - `fonte` (enum: referral, adv, sito, altro)
      - `note_generali` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `deals`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `oggetto_trattativa` (text, required)
      - `valore_stimato` (numeric, required)
      - `data_apertura` (timestamp, required)
      - `stato_trattativa` (enum: in_corso, vinta, persa)
      - `scadenza_prossimo_contatto` (timestamp, optional)
      - `note` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `activities`
      - `id` (uuid, primary key)
      - `tipo_attivita` (enum: call, email, meeting)
      - `data_ora` (timestamp, required)
      - `esito` (enum: positiva, da_richiamare, nessuna_risposta)
      - `client_id` (uuid, foreign key to clients, optional)
      - `deal_id` (uuid, foreign key to deals, optional)
      - `note` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create enum types
CREATE TYPE client_status AS ENUM ('lead', 'prospect', 'cliente');
CREATE TYPE client_source AS ENUM ('referral', 'adv', 'sito', 'altro');
CREATE TYPE deal_status AS ENUM ('in_corso', 'vinta', 'persa');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting');
CREATE TYPE activity_outcome AS ENUM ('positiva', 'da_richiamare', 'nessuna_risposta');

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_azienda text NOT NULL,
  referente_principale text NOT NULL,
  email text NOT NULL,
  telefono text NOT NULL,
  settore text NOT NULL,
  stato client_status NOT NULL DEFAULT 'lead',
  fonte client_source NOT NULL DEFAULT 'sito',
  note_generali text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  oggetto_trattativa text NOT NULL,
  valore_stimato numeric NOT NULL DEFAULT 0,
  data_apertura timestamptz NOT NULL DEFAULT now(),
  stato_trattativa deal_status NOT NULL DEFAULT 'in_corso',
  scadenza_prossimo_contatto timestamptz,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_attivita activity_type NOT NULL,
  data_ora timestamptz NOT NULL,
  esito activity_outcome NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for clients
CREATE POLICY "Enable all operations for authenticated users on clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for deals
CREATE POLICY "Enable all operations for authenticated users on deals"
  ON deals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for activities
CREATE POLICY "Enable all operations for authenticated users on activities"
  ON activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_stato ON clients(stato);
CREATE INDEX IF NOT EXISTS idx_clients_fonte ON clients(fonte);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_stato ON deals(stato_trattativa);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_data_ora ON activities(data_ora);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();