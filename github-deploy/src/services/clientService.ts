import { supabase } from '../lib/supabase';
import { Client } from '../types';
import { errorHandler } from '../utils/errorHandler';
import { getMockDataIfNeeded, mockClients } from '../utils/mockData';
import { cacheManager, invalidateClientCache } from '../utils/cacheManager';

// Helper function to check if error is due to missing table
const isTableMissingError = (error: any): boolean => {
  return error?.code === 'PGRST116' || 
         error?.message?.includes('relation') && error?.message?.includes('does not exist') ||
         error?.code === '42P01' ||
         error?.details?.includes('does not exist');
};

// Helper function to check if error is due to missing column
const isColumnMissingError = (error: any): boolean => {
  return error?.code === 'PGRST203' || 
         error?.message?.includes('column') && error?.message?.includes('does not exist');
};

// Validation functions
const validateClientData = (client: Partial<Client>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (client.nome_azienda && typeof client.nome_azienda !== 'string') {
    errors.push('Nome azienda deve essere una stringa');
  }
  
  if (client.nome_azienda && client.nome_azienda.trim().length < 2) {
    errors.push('Nome azienda deve avere almeno 2 caratteri');
  }
  
  if (client.indirizzo_mail && typeof client.indirizzo_mail !== 'string') {
    errors.push('Email deve essere una stringa');
  }
  
  if (client.indirizzo_mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.indirizzo_mail)) {
    errors.push('Email non valida');
  }
  
  if (client.contatti && typeof client.contatti !== 'string') {
    errors.push('Contatti deve essere una stringa');
  }
  
  if (client.contatti && client.contatti.trim().length > 0 && !/^[+]?[0-9\s\-()]+$/.test(client.contatti)) {
    errors.push('Formato contatti non valido');
  }
  
  if (client.figura_preposta && typeof client.figura_preposta !== 'string') {
    errors.push('Figura preposta deve essere una stringa');
  }
  
  if (client.valore_mensile && (typeof client.valore_mensile !== 'number' || client.valore_mensile < 0)) {
    errors.push('Valore mensile deve essere un numero positivo');
  }
  
  if (client.valore_spot && (typeof client.valore_spot !== 'number' || client.valore_spot < 0)) {
    errors.push('Valore spot deve essere un numero positivo');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateRequiredFields = (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!client.nome_azienda || client.nome_azienda.trim().length === 0) {
    errors.push('Nome azienda è obbligatorio');
  }
  
  if (!client.indirizzo_mail || client.indirizzo_mail.trim().length === 0) {
    errors.push('Email è obbligatoria');
  }
  
  if (!client.stato_trattativa) {
    errors.push('Stato trattativa è obbligatorio');
  }
  
  if (!client.user_id) {
    errors.push('User ID è obbligatorio');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const clientService = {
  async getAll(): Promise<Client[]> {
    try {
      // Controlla la cache prima
      const cachedClients = cacheManager.get<Client[]>('clients');
      if (cachedClients) {
        return cachedClients;
      }
      
      // Usa getMockDataIfNeeded per gestire automaticamente il fallback
      const clients = await getMockDataIfNeeded(
        mockClients,
        async () => {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) {
            if (isTableMissingError(error)) {
              console.warn('Clients table not configured yet. Using mock data.');
              throw new Error('Table not configured');
            }
            throw error;
          }
          
          return data || [];
        }
      );
      
      // Salva nella cache
      cacheManager.set('clients', clients);
      return clients;
      
    } catch (error: any) {
      console.warn('Client service error:', error);
      return errorHandler.handleReadError(error, 'fetch clients', mockClients);
    }
  },

  async getById(id: string): Promise<Client | null> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Clients table not configured yet.');
          return null;
        }
        return errorHandler.handleReadError(error, 'fetch client by ID', null);
      }
      return data;
    } catch (error: any) {
      console.warn('Client service not available:', error);
      return null;
    }
  },

  async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    try {
      // Validazione dei campi obbligatori
      const requiredValidation = validateRequiredFields(client);
      if (!requiredValidation.isValid) {
        throw new Error(`Validation failed: ${requiredValidation.errors.join(', ')}`);
      }
      
      // Validazione generale dei dati
      const validation = validateClientData(client);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Sanitizza i dati
      const sanitizedClient = {
        ...client,
        nome_azienda: client.nome_azienda.trim(),
        indirizzo_mail: client.indirizzo_mail.toLowerCase().trim(),
        contatti: client.contatti?.trim() || null,
        figura_preposta: client.figura_preposta?.trim() || null,
      };
      
      const clientData = {
        ...sanitizedClient,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();
      
      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Clients table not configured yet.');
          throw new Error('Database not configured');
        }
        errorHandler.handleWriteError(error, 'creazione cliente');
        throw error;
      }
      
      // Invalida la cache
      invalidateClientCache();
      
      errorHandler.handleSuccess('create');
      return data;
    } catch (error: any) {
      if (error.message?.includes('Validation failed') || error.message?.includes('Database not configured')) {
        throw error;
      }
      errorHandler.handleWriteError(error, 'creazione cliente');
      throw error;
    }
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    try {
      // Validazione ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new Error('ID cliente non valido');
      }
      
      // Validazione dei dati di aggiornamento
      const validation = validateClientData(updates);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Sanitizza i dati di aggiornamento
      const sanitizedUpdates: Partial<Client> = {};
      
      if (updates.nome_azienda !== undefined) {
        sanitizedUpdates.nome_azienda = updates.nome_azienda.trim();
      }
      if (updates.indirizzo_mail !== undefined) {
        sanitizedUpdates.indirizzo_mail = updates.indirizzo_mail.toLowerCase().trim();
      }
      if (updates.contatti !== undefined) {
        sanitizedUpdates.contatti = updates.contatti?.trim() || null;
      }
      if (updates.figura_preposta !== undefined) {
        sanitizedUpdates.figura_preposta = updates.figura_preposta?.trim() || null;
      }
      if (updates.valore_mensile !== undefined) {
        sanitizedUpdates.valore_mensile = updates.valore_mensile;
      }
      if (updates.valore_spot !== undefined) {
        sanitizedUpdates.valore_spot = updates.valore_spot;
      }
      if (updates.data_scadenza_contratto !== undefined) {
        sanitizedUpdates.data_scadenza_contratto = updates.data_scadenza_contratto;
      }
      if (updates.stato_trattativa !== undefined) {
        sanitizedUpdates.stato_trattativa = updates.stato_trattativa;
      }
      
      const { data, error } = await supabase
        .from('clients')
        .update({ 
          ...sanitizedUpdates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Clients table not configured yet.');
          throw new Error('Database not configured');
        }
        errorHandler.handleWriteError(error, 'aggiornamento cliente');
        throw error;
      }
      
      // Invalida la cache
      invalidateClientCache();
      
      errorHandler.handleSuccess('update');
      return data;
    } catch (error: any) {
      if (error.message?.includes('Validation failed') || 
          error.message?.includes('Database not configured') ||
          error.message?.includes('ID cliente non valido')) {
        throw error;
      }
      errorHandler.handleWriteError(error, 'aggiornamento cliente');
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Validazione ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new Error('ID cliente non valido');
      }
      
      // Verifica che il cliente esista prima di eliminarlo
      const existingClient = await this.getById(id);
      if (!existingClient) {
        throw new Error('Cliente non trovato');
      }
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Clients table not configured yet.');
          throw new Error('Database not configured');
        }
        errorHandler.handleWriteError(error, 'eliminazione cliente');
        throw error;
      }
      
      // Invalida la cache
      invalidateClientCache();
      
      errorHandler.handleSuccess('delete');
    } catch (error: any) {
      if (error.message?.includes('Database not configured') ||
          error.message?.includes('ID cliente non valido') ||
          error.message?.includes('Cliente non trovato')) {
        throw error;
      }
      errorHandler.handleWriteError(error, 'eliminazione cliente');
      throw error;
    }
  },
  
  // Metodi di utilità aggiuntivi
  async validateEmail(email: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('indirizzo_mail', email.toLowerCase().trim())
        .limit(1);
      
      return (data?.length || 0) === 0;
    } catch (error) {
      console.warn('Email validation failed:', error);
      return true; // In caso di errore, permetti l'email
    }
  },
  
  async searchClients(query: string): Promise<Client[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      
      const searchTerm = `%${query.trim()}%`;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`nome_azienda.ilike.${searchTerm},indirizzo_mail.ilike.${searchTerm},figura_preposta.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        if (isTableMissingError(error)) {
          // Fallback alla ricerca nei mock data
          const lowerQuery = query.toLowerCase();
          return mockClients.filter(client => 
            client.nome_azienda.toLowerCase().includes(lowerQuery) ||
            client.indirizzo_mail.toLowerCase().includes(lowerQuery) ||
            (client.figura_preposta && client.figura_preposta.toLowerCase().includes(lowerQuery))
          ).slice(0, 20);
        }
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      console.warn('Client search error:', error);
      return [];
    }
  }
};