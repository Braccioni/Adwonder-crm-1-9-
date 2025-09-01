export type StatoTrattativa = 'in_corso' | 'vinta' | 'persa' | 'sospesa';
// Rimuovo la definizione duplicata
// export type TipologiaProposta = 'consulenza' | 'formazione' | 'audit' | 'implementazione' | 'manutenzione' | 'altro';
export type Frequenza = 'una_tantum' | 'mensile' | 'trimestrale' | 'semestrale' | 'annuale';
export type DealStatus = 'in_corso' | 'vinta' | 'persa';
export type ActivityType = 'call' | 'email' | 'meeting';
export type ActivityOutcome = 'positiva' | 'da_richiamare' | 'nessuna_risposta';
export type NotificationType = 'scadenza_45' | 'reminder_30' | 'sollecito_15';
export type ProjectStatus = 'pianificazione' | 'in_corso' | 'completato' | 'sospeso' | 'annullato';
export type ProjectPriority = 'bassa' | 'media' | 'alta' | 'critica';
export type CollaboratorRole = 'project_manager' | 'developer' | 'designer' | 'analyst' | 'consultant' | 'grafico' | 'amazon_specialist' | 'linkedin_specialist' | 'advertiser' | 'altro';
export type TipoCompenso = 'gettone' | 'fisso';

export interface Client {
  id: string;
  nome_azienda: string;
  figura_preposta: string;
  contatti: string;
  data_invio_proposta?: string;
  indirizzo_mail: string;
  proposta_presentata?: string;
  tipologia_proposta?: TipologiaProposta;
  frequenza?: Frequenza;
  valore_mensile?: number;
  valore_spot?: number;
  stato_trattativa: StatoTrattativa;
  data_fine?: string;
  giorni_gestazione?: number;
  durata?: string;
  fine_lavori?: string;
  estensione?: string;
  // Contract expiration fields
  data_inizio_contratto?: string;
  data_scadenza_contratto?: string;
  durata_contratto_mesi?: number;
  rinnovo_automatico?: boolean;
  notifiche_attive?: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  client_id: string;
  oggetto_trattativa: string;
  valore_stimato: number;
  data_apertura: string;
  stato_trattativa: DealStatus;
  scadenza_prossimo_contatto?: string;
  note?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Activity {
  id: string;
  tipo_attivita: ActivityType;
  data_ora: string;
  esito: ActivityOutcome;
  client_id?: string;
  deal_id?: string;
  note?: string;
  user_id: string;
  created_at: string;
  client?: Client;
  deal?: Deal;
}

export interface Notification {
  id: string;
  client_id: string;
  nome_azienda?: string;
  tipo_notifica: NotificationType;
  data_notifica: string;
  data_scadenza_contratto: string;
  messaggio: string;
  giorni_rimanenti?: number;
  letta: boolean;
  inviata: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Project {
  id: string;
  nome_progetto: string;
  descrizione?: string;
  client_id: string;
  stato: ProjectStatus;
  priorita: ProjectPriority;
  data_inizio: string;
  data_fine_prevista: string;
  data_fine_effettiva?: string;
  budget_stimato?: number;
  budget_utilizzato?: number;
  note?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  collaboratori?: ProjectCollaborator[];
}

export interface Collaborator {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  ruolo_principale: CollaboratorRole;
  tipo_compenso: TipoCompenso;
  compenso_per_gettone?: number;
  compenso_fisso?: number;
  gettoni_disponibili: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  collaborator_id: string;
  ruolo_progetto: CollaboratorRole;
  gettoni_assegnati: number;
  gettoni_utilizzati: number;
  data_assegnazione: string;
  note?: string;
  project?: Project;
  collaborator?: Collaborator;
}

export interface DashboardStats {
  total_clients: number;
  active_deals: number;
  won_deals: number;
  lost_deals: number;
  total_deal_value: number;
  this_week_activities: number;
  pending_notifications: number;
  contracts_expiring_soon: number;
  // Best clients and performance metrics
  best_client_by_revenue?: {
    nome_azienda: string;
    total_revenue: number;
  };
  best_client_by_contract_duration?: {
    nome_azienda: string;
    contract_duration_months: number;
  };
  best_sales_performance?: {
    best_month?: {
      month: string;
      deals_count: number;
      total_value: number;
    };
    best_day?: {
      date: string;
      deals_count: number;
    };
    biggest_deal?: {
      oggetto_trattativa: string;
      valore_stimato: number;
      client_name: string;
    };
  };
}
// Mantengo solo questa definizione completa alla fine del file
export type TipologiaProposta = 'advertising' | 'mail_marketing' | 'social_media' | 'nuovo_sito' | 'restyling_sito' | 'adv_lead_generation_b2b' | 'adv_mma' | 'adv_mma_landing_page' | 'adv_mma_sito' | 'all_inclusive' | 'linkedin' | 'amazon';