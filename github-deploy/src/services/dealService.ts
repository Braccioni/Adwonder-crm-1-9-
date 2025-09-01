import { supabase } from '../lib/supabase';
import { Deal } from '../types';
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

export const dealService = {
  async getAll(): Promise<Deal[]> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Deals table not configured yet. Returning empty array.');
          return [];
        }
        return errorHandler.handleReadError(error, 'fetch deals', []);
      }
      return data || [];
    } catch (error: any) {
      console.warn('Deal service not available:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Deal | null> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Deals table not configured yet.');
          return null;
        }
        return errorHandler.handleReadError(error, 'fetch deal by id', null);
      }
      return data;
    } catch (error: any) {
      console.warn('Deal service not available:', error);
      return null;
    }
  },

  async create(deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'client'>): Promise<Deal> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert([deal])
        .select(`
          *,
          client:clients(*)
        `)
        .single();
      
      if (error) {
        errorHandler.handleWriteError(error, 'create deal');
        throw error;
      }
      
      errorHandler.handleSuccess('Deal created successfully');
      return data;
    } catch (error) {
      errorHandler.handleWriteError(error, 'create deal');
      throw error;
    }
  },

  async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(*)
        `)
        .single();
      
      if (error) {
        errorHandler.handleWriteError(error, 'update deal');
        throw error;
      }
      
      errorHandler.handleSuccess('Deal updated successfully');
      return data;
    } catch (error) {
      errorHandler.handleWriteError(error, 'update deal');
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
      
      if (error) {
        errorHandler.handleWriteError(error, 'delete deal');
        throw error;
      }
      
      errorHandler.handleSuccess('Deal deleted successfully');
    } catch (error) {
      errorHandler.handleWriteError(error, 'delete deal');
      throw error;
    }
  }
};