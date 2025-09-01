import { supabase } from '../lib/supabase';
import { Activity } from '../types';
import { errorHandler } from '../utils/errorHandler';

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

export const activityService = {
  async getAll(): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          client:clients(*),
          deal:deals(*)
        `)
        .order('data_ora', { ascending: false });
      
      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Activities table not configured yet. Returning empty array.');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error: any) {
      console.warn('Activity service not available:', error);
      return [];
    }
  },

  async create(activity: Omit<Activity, 'id' | 'created_at' | 'client' | 'deal'>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([activity])
        .select(`
          *,
          client:clients(*),
          deal:deals(*)
        `)
        .single();
      
      if (error) {
        if (isTableMissingError(error)) {
          throw new Error('Activities table not configured. Please check your database setup.');
        }
        throw error;
      }
      errorHandler.handleSuccess('Attività creata con successo');
      return data;
    } catch (error) {
      throw errorHandler.handleWriteError(error, 'create', 'activity');
    }
  },

  async update(id: string, updates: Partial<Activity>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          deal:deals(*)
        `)
        .single();
      
      if (error) {
        if (isTableMissingError(error)) {
          throw new Error('Activities table not configured. Please check your database setup.');
        }
        throw error;
      }
      errorHandler.handleSuccess('Attività aggiornata con successo');
      return data;
    } catch (error) {
      throw errorHandler.handleWriteError(error, 'update', 'activity');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (isTableMissingError(error)) {
          throw new Error('Activities table not configured. Please check your database setup.');
        }
        throw error;
      }
      errorHandler.handleSuccess('Attività eliminata con successo');
    } catch (error) {
      throw errorHandler.handleWriteError(error, 'delete', 'activity');
    }
  }
};