// Cache manager per gestire l'invalidazione automatica dei dati

type CacheKey = 'dashboard' | 'clients' | 'deals' | 'activities' | 'notifications';

interface CacheEntry {
  data: any;
  timestamp: number;
  dependencies: CacheKey[];
}

class CacheManager {
  private cache = new Map<CacheKey, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minuti

  // Imposta un valore nella cache con le sue dipendenze
  set<T>(key: CacheKey, data: T, dependencies: CacheKey[] = [], ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
      dependencies
    });
  }

  // Ottiene un valore dalla cache se valido
  get<T>(key: CacheKey): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Controlla se la cache è scaduta
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Invalida una chiave specifica e tutte le sue dipendenze
  invalidate(key: CacheKey): void {
    // Rimuovi la chiave principale
    this.cache.delete(key);

    // Trova e rimuovi tutte le chiavi che dipendono da questa
    const keysToInvalidate: CacheKey[] = [];
    
    for (const [cacheKey, entry] of this.cache.entries()) {
      if (entry.dependencies.includes(key)) {
        keysToInvalidate.push(cacheKey);
      }
    }

    // Rimuovi ricorsivamente le dipendenze
    keysToInvalidate.forEach(k => {
      this.cache.delete(k);
    });
  }

  // Invalida tutte le cache
  invalidateAll(): void {
    this.cache.clear();
  }

  // Controlla se una chiave è presente e valida nella cache
  has(key: CacheKey): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && Date.now() <= entry.timestamp;
  }

  // Ottiene informazioni sullo stato della cache
  getStats(): { size: number; keys: CacheKey[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Pulisce le cache scadute
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: CacheKey[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

// Istanza singleton del cache manager
export const cacheManager = new CacheManager();

// Funzioni di utilità per invalidare cache specifiche
export const invalidateClientCache = () => {
  cacheManager.invalidate('clients');
  cacheManager.invalidate('dashboard'); // Dashboard dipende dai clienti
};

export const invalidateDealCache = () => {
  cacheManager.invalidate('deals');
  cacheManager.invalidate('dashboard'); // Dashboard dipende dalle trattative
};

export const invalidateActivityCache = () => {
  cacheManager.invalidate('activities');
  cacheManager.invalidate('dashboard'); // Dashboard dipende dalle attività
};

export const invalidateNotificationCache = () => {
  cacheManager.invalidate('notifications');
  cacheManager.invalidate('dashboard'); // Dashboard dipende dalle notifiche
};

// Avvia la pulizia automatica delle cache scadute ogni 10 minuti
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup();
  }, 10 * 60 * 1000);
}

export default cacheManager;