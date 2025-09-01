/**
 * Configurazione dell'ambiente e gestione del fallback
 */

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
  enableMockData: boolean;
  apiTimeout: number;
  cacheTimeout: number;
}

// Configurazione di default
const defaultConfig: EnvironmentConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  enableMockData: false,
  apiTimeout: 10000, // 10 secondi
  cacheTimeout: 5 * 60 * 1000, // 5 minuti
};

// Stato della connessione Supabase
let supabaseConnectionStatus: 'unknown' | 'connected' | 'failed' = 'unknown';
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 secondi

/**
 * Verifica se Supabase è configurato correttamente
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(defaultConfig.supabaseUrl && defaultConfig.supabaseAnonKey);
};

/**
 * Verifica se la connessione a Supabase è disponibile
 */
export const isSupabaseAvailable = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Se abbiamo controllato di recente, usa il risultato cached
  if (now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL && supabaseConnectionStatus !== 'unknown') {
    return supabaseConnectionStatus === 'connected';
  }
  
  // Se Supabase non è configurato, non è disponibile
  if (!isSupabaseConfigured()) {
    supabaseConnectionStatus = 'failed';
    lastConnectionCheck = now;
    return false;
  }
  
  try {
    // Test di connessione semplice
    const response = await fetch(`${defaultConfig.supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': defaultConfig.supabaseAnonKey,
        'Authorization': `Bearer ${defaultConfig.supabaseAnonKey}`
      },
      signal: AbortSignal.timeout(5000) // 5 secondi timeout
    });
    
    supabaseConnectionStatus = response.ok ? 'connected' : 'failed';
  } catch (error) {
    console.warn('Supabase connection test failed:', error);
    supabaseConnectionStatus = 'failed';
  }
  
  lastConnectionCheck = now;
  return supabaseConnectionStatus === 'connected';
};

/**
 * Determina se usare i mock data
 */
export const shouldUseMockData = async (): Promise<boolean> => {
  // Se è esplicitamente abilitato
  if (defaultConfig.enableMockData) {
    return true;
  }
  
  // Se siamo in sviluppo e Supabase non è disponibile
  if (defaultConfig.isDevelopment) {
    const isAvailable = await isSupabaseAvailable();
    return !isAvailable;
  }
  
  // In produzione, usa sempre Supabase (con fallback gestito nei servizi)
  return false;
};

/**
 * Forza l'uso dei mock data (utile per testing)
 */
export const enableMockData = (enable: boolean = true): void => {
  defaultConfig.enableMockData = enable;
  // Reset dello stato di connessione per forzare un nuovo check
  supabaseConnectionStatus = 'unknown';
  lastConnectionCheck = 0;
};

/**
 * Ottieni la configurazione corrente
 */
export const getConfig = (): Readonly<EnvironmentConfig> => {
  return Object.freeze({ ...defaultConfig });
};

/**
 * Ottieni lo stato della connessione Supabase
 */
export const getConnectionStatus = (): {
  status: typeof supabaseConnectionStatus;
  lastCheck: number;
  isConfigured: boolean;
} => {
  return {
    status: supabaseConnectionStatus,
    lastCheck: lastConnectionCheck,
    isConfigured: isSupabaseConfigured()
  };
};

/**
 * Reset dello stato di connessione (utile per retry)
 */
export const resetConnectionStatus = (): void => {
  supabaseConnectionStatus = 'unknown';
  lastConnectionCheck = 0;
};

export default defaultConfig;