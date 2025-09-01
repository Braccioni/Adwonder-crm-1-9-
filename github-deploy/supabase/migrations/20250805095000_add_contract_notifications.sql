/*
  # Contract Expiration Notifications

  1. Updates to clients table
    - Add contract expiration fields
    - Add notification preferences

  2. New notifications table
    - Track contract expiration notifications
    - Support for multiple notification types

  3. Functions for automatic notification generation
*/

-- Add contract expiration fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_inizio_contratto DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_scadenza_contratto DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS durata_contratto_mesi INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rinnovo_automatico BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notifiche_attive BOOLEAN DEFAULT true;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tipo_notifica TEXT NOT NULL CHECK (tipo_notifica IN ('scadenza_45', 'reminder_30', 'sollecito_15')),
  data_notifica DATE NOT NULL,
  data_scadenza_contratto DATE NOT NULL,
  messaggio TEXT NOT NULL,
  letta BOOLEAN DEFAULT false,
  inviata BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_data_notifica ON notifications(data_notifica);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_data_scadenza ON clients(data_scadenza_contratto);

-- Function to generate notifications for contract expirations
CREATE OR REPLACE FUNCTION generate_contract_notifications()
RETURNS void AS $$
DECLARE
  client_record RECORD;
  notification_45_date DATE;
  notification_30_date DATE;
  notification_15_date DATE;
BEGIN
  -- Loop through all clients with active contracts and notifications enabled
  FOR client_record IN 
    SELECT id, nome_azienda, data_scadenza_contratto, user_id
    FROM clients 
    WHERE data_scadenza_contratto IS NOT NULL 
      AND notifiche_attive = true
      AND data_scadenza_contratto > CURRENT_DATE
  LOOP
    -- Calculate notification dates
    notification_45_date := client_record.data_scadenza_contratto - INTERVAL '45 days';
    notification_30_date := client_record.data_scadenza_contratto - INTERVAL '30 days';
    notification_15_date := client_record.data_scadenza_contratto - INTERVAL '15 days';
    
    -- Insert 45-day notification if it doesn't exist and date is in the future
    IF notification_45_date >= CURRENT_DATE THEN
      INSERT INTO notifications (client_id, tipo_notifica, data_notifica, data_scadenza_contratto, messaggio, user_id)
      SELECT 
        client_record.id,
        'scadenza_45',
        notification_45_date,
        client_record.data_scadenza_contratto,
        'Il contratto di ' || client_record.nome_azienda || ' scadrà tra 45 giorni (' || client_record.data_scadenza_contratto || ')',
        client_record.user_id
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE client_id = client_record.id 
          AND tipo_notifica = 'scadenza_45'
          AND data_scadenza_contratto = client_record.data_scadenza_contratto
      );
    END IF;
    
    -- Insert 30-day notification if it doesn't exist and date is in the future
    IF notification_30_date >= CURRENT_DATE THEN
      INSERT INTO notifications (client_id, tipo_notifica, data_notifica, data_scadenza_contratto, messaggio, user_id)
      SELECT 
        client_record.id,
        'reminder_30',
        notification_30_date,
        client_record.data_scadenza_contratto,
        'REMINDER: Il contratto di ' || client_record.nome_azienda || ' scadrà tra 30 giorni (' || client_record.data_scadenza_contratto || ')',
        client_record.user_id
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE client_id = client_record.id 
          AND tipo_notifica = 'reminder_30'
          AND data_scadenza_contratto = client_record.data_scadenza_contratto
      );
    END IF;
    
    -- Insert 15-day notification if it doesn't exist and date is in the future
    IF notification_15_date >= CURRENT_DATE THEN
      INSERT INTO notifications (client_id, tipo_notifica, data_notifica, data_scadenza_contratto, messaggio, user_id)
      SELECT 
        client_record.id,
        'sollecito_15',
        notification_15_date,
        client_record.data_scadenza_contratto,
        'SOLLECITO FINALE: Il contratto di ' || client_record.nome_azienda || ' scadrà tra 15 giorni (' || client_record.data_scadenza_contratto || ')',
        client_record.user_id
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE client_id = client_record.id 
          AND tipo_notifica = 'sollecito_15'
          AND data_scadenza_contratto = client_record.data_scadenza_contratto
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending notifications for today
CREATE OR REPLACE FUNCTION get_pending_notifications(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  nome_azienda TEXT,
  tipo_notifica TEXT,
  data_notifica DATE,
  data_scadenza_contratto DATE,
  messaggio TEXT,
  giorni_rimanenti INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.client_id,
    c.nome_azienda,
    n.tipo_notifica,
    n.data_notifica,
    n.data_scadenza_contratto,
    n.messaggio,
    (n.data_scadenza_contratto - CURRENT_DATE)::INTEGER as giorni_rimanenti
  FROM notifications n
  JOIN clients c ON n.client_id = c.id
  WHERE n.user_id = user_uuid
    AND n.data_notifica <= CURRENT_DATE
    AND n.letta = false
    AND c.data_scadenza_contratto > CURRENT_DATE
  ORDER BY n.data_notifica ASC, n.tipo_notifica;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate initial notifications for existing clients
SELECT generate_contract_notifications();