-- Update clients table structure to match TypeScript interface

-- Add new columns
ALTER TABLE clients ADD COLUMN IF NOT EXISTS figura_preposta TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contatti TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS indirizzo_mail TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_invio_proposta DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS proposta_presentata TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tipologia_proposta TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS frequenza TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS valore_mensile DECIMAL(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS valore_spot DECIMAL(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stato_trattativa TEXT DEFAULT 'in_corso';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_fine DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS giorni_gestazione INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS durata TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fine_lavori TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estensione TEXT;

-- Migrate existing data
UPDATE clients SET 
  figura_preposta = referente_principale,
  contatti = telefono,
  indirizzo_mail = email
WHERE figura_preposta IS NULL;

-- Make required fields NOT NULL
ALTER TABLE clients ALTER COLUMN figura_preposta SET NOT NULL;
ALTER TABLE clients ALTER COLUMN contatti SET NOT NULL;
ALTER TABLE clients ALTER COLUMN indirizzo_mail SET NOT NULL;

-- Drop old columns (optional - uncomment if you want to remove them)
-- ALTER TABLE clients DROP COLUMN IF EXISTS referente_principale;
-- ALTER TABLE clients DROP COLUMN IF EXISTS email;
-- ALTER TABLE clients DROP COLUMN IF EXISTS telefono;
-- ALTER TABLE clients DROP COLUMN IF EXISTS settore;
-- ALTER TABLE clients DROP COLUMN IF EXISTS stato;
-- ALTER TABLE clients DROP COLUMN IF EXISTS fonte;
-- ALTER TABLE clients DROP COLUMN IF EXISTS note_generali;