import { supabase } from '../lib/supabase';
import { Collaborator, ProjectCollaborator } from '../types';

export const collaboratorService = {
  async getAll(): Promise<Collaborator[]> {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .order('cognome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Error fetching collaborators:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Collaborator | null> {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error fetching collaborator:', error);
      return null;
    }
  },

  async create(collaborator: Omit<Collaborator, 'id' | 'created_at' | 'updated_at'>): Promise<Collaborator> {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .insert({
          nome: collaborator.nome,
          cognome: collaborator.cognome,
          email: collaborator.email,
          telefono: collaborator.telefono,
          ruolo_principale: collaborator.ruolo_principale,
          tipo_compenso: collaborator.tipo_compenso,
          compenso_per_gettone: collaborator.compenso_per_gettone,
          compenso_fisso: collaborator.compenso_fisso,
          gettoni_disponibili: collaborator.gettoni_disponibili,
          user_id: collaborator.user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error creating collaborator:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Collaborator>): Promise<Collaborator> {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error updating collaborator:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.warn('Error deleting collaborator:', error);
      throw error;
    }
  },

  async updateTokens(id: string, newTokenCount: number): Promise<Collaborator> {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .update({ 
          gettoni_disponibili: newTokenCount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error updating collaborator tokens:', error);
      throw error;
    }
  }
};

export const projectCollaboratorService = {
  async assignToProject(assignment: Omit<ProjectCollaborator, 'id' | 'project' | 'collaborator'>): Promise<ProjectCollaborator> {
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .insert(assignment)
        .select(`
          *,
          project:projects(*),
          collaborator:collaborators(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error assigning collaborator to project:', error);
      throw error;
    }
  },

  async updateAssignment(id: string, updates: Partial<ProjectCollaborator>): Promise<ProjectCollaborator> {
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          project:projects(*),
          collaborator:collaborators(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error updating project assignment:', error);
      throw error;
    }
  },

  async removeFromProject(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.warn('Error removing collaborator from project:', error);
      throw error;
    }
  },

  async getProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select(`
          *,
          collaborator:collaborators(*)
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Error fetching project collaborators:', error);
      return [];
    }
  },

  async useTokens(assignmentId: string, tokensUsed: number): Promise<ProjectCollaborator> {
    try {
      // First get current assignment
      const { data: assignment, error: fetchError } = await supabase
        .from('project_collaborators')
        .select('gettoni_utilizzati')
        .eq('id', assignmentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newTokensUsed = (assignment.gettoni_utilizzati || 0) + tokensUsed;
      
      const { data, error } = await supabase
        .from('project_collaborators')
        .update({ gettoni_utilizzati: newTokensUsed })
        .eq('id', assignmentId)
        .select(`
          *,
          project:projects(*),
          collaborator:collaborators(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error using tokens:', error);
      throw error;
    }
  }
};