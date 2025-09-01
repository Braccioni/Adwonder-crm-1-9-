/**
 * Mock data per lo sviluppo e testing
 */

import { Client, Deal, Activity, Notification, DashboardStats } from '../types';
import { shouldUseMockData as shouldUseMockDataFromConfig } from '../config/environment';

// Mock clients data
export const mockClients: Client[] = [
  {
    id: '1',
    nome_azienda: 'Azienda Demo 1',
    figura_preposta: 'Mario Rossi',
    contatti: '+39 123 456 7890',
    indirizzo_mail: 'mario.rossi@demo1.com',
    data_invio_proposta: '2024-01-15',
    proposta_presentata: 'Proposta Marketing Digitale',
    tipologia_proposta: 'advertising',
    frequenza: 'mensile',
    valore_mensile: 2500.00,
    valore_spot: 0,
    stato_trattativa: 'in_corso',
    data_fine: undefined,
    giorni_gestazione: 30,
    durata: '12 mesi',
    fine_lavori: undefined,
    estensione: undefined,
    user_id: 'admin-user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    nome_azienda: 'Azienda Demo 2',
    figura_preposta: 'Laura Bianchi',
    contatti: '+39 987 654 3210',
    indirizzo_mail: 'laura.bianchi@demo2.com',
    data_invio_proposta: '2024-02-01',
    proposta_presentata: 'Consulenza SEO',
    tipologia_proposta: 'nuovo_sito',
    frequenza: 'una_tantum',
    valore_mensile: 0,
    valore_spot: 5000.00,
    stato_trattativa: 'vinta',
    data_fine: '2024-02-15',
    giorni_gestazione: 14,
    durata: '3 mesi',
    fine_lavori: '2024-05-15',
    estensione: undefined,
    user_id: 'admin-user',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z'
  }
];

// Mock deals data
export const mockDeals: Deal[] = [
  {
    id: '1',
    client_id: '1',
    oggetto_trattativa: 'Campagna Marketing Q1',
    valore_stimato: 2500,
    data_apertura: '2024-01-01T00:00:00Z',
    stato_trattativa: 'in_corso',
    scadenza_prossimo_contatto: '2024-01-20T00:00:00Z',
    note: 'Cliente interessato, da ricontattare',
    user_id: 'admin-user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    client_id: '2',
    oggetto_trattativa: 'Progetto SEO',
    valore_stimato: 5000,
    data_apertura: '2024-02-01T00:00:00Z',
    stato_trattativa: 'vinta',
    scadenza_prossimo_contatto: undefined,
    note: 'Contratto firmato',
    user_id: 'admin-user',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z'
  }
];

// Mock activities data
export const mockActivities: Activity[] = [
  {
    id: '1',
    tipo_attivita: 'call',
    data_ora: '2024-01-15T10:00:00Z',
    esito: 'positiva',
    client_id: '1',
    deal_id: '1',
    note: 'Cliente interessato alla proposta',
    user_id: 'admin-user',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    tipo_attivita: 'email',
    data_ora: '2024-02-10T14:30:00Z',
    esito: 'positiva',
    client_id: '2',
    deal_id: '2',
    note: 'Inviata proposta finale',
    user_id: 'admin-user',
    created_at: '2024-02-10T14:30:00Z'
  }
];

// Mock notifications data
export const mockNotifications: Notification[] = [
  {
    id: '1',
    client_id: '1',
    tipo_notifica: 'scadenza_45',
    data_notifica: '2024-03-01',
    data_scadenza_contratto: '2024-04-15',
    messaggio: 'Il contratto con Azienda Demo 1 scadrà tra 45 giorni',
    letta: false,
    inviata: false,
    user_id: 'admin-user',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
    nome_azienda: 'Azienda Demo 1'
  }
];

// Mock dashboard stats
export const mockDashboardStats: DashboardStats = {
  total_clients: 2,
  active_deals: 1,
  won_deals: 1,
  lost_deals: 0,
  total_deal_value: 2500,
  this_week_activities: 2,
  pending_notifications: 1,
  contracts_expiring_soon: 1,
  best_client_by_revenue: {
    nome_azienda: 'Azienda Demo 2',
    total_revenue: 5000
  },
  best_client_by_contract_duration: {
    nome_azienda: 'Azienda Demo 1',
    contract_duration_months: 12
  },
  best_sales_performance: {
    best_month: {
      month: '2024-02',
      deals_count: 1,
      total_value: 5000
    },
    best_day: {
      date: '2024-02-15',
      deals_count: 1
    },
    biggest_deal: {
      oggetto_trattativa: 'Progetto SEO',
      valore_stimato: 5000,
      client_name: 'Azienda Demo 2'
    }
  }
};

// Funzione helper per simulare ritardo API
export const simulateApiDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Funzione per ottenere mock data con controllo asincrono
export const getMockDataIfNeeded = async <T>(mockData: T, realDataFetcher: () => Promise<T>): Promise<T> => {
  const useMock = await shouldUseMockData();
  
  if (useMock) {
    await simulateApiDelay(200); // Simula un piccolo ritardo
    return mockData;
  }
  
  try {
    return await realDataFetcher();
  } catch (error) {
    console.warn('Real data fetch failed, falling back to mock data:', error);
    await simulateApiDelay(100);
    return mockData;
  }
};

// Funzione per determinare se usare mock data (ora usa la configurazione centralizzata)
export const shouldUseMockData = async (): Promise<boolean> => {
  return await shouldUseMockDataFromConfig();
};

// Versione sincrona per compatibilità con codice esistente
export const shouldUseMockDataSync = (): boolean => {
  // Fallback per uso sincrono - controlla solo la configurazione base
  const hasSupabaseConfig = Boolean(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
  return import.meta.env.DEV && !hasSupabaseConfig;
};