import { supabase } from '../lib/supabase';
import { Project } from '../types';

export const projectService = {
  async getAll(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          collaboratori:project_collaborators(
            *,
            collaborator:collaborators(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Error fetching projects:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          collaboratori:project_collaborators(
            *,
            collaborator:collaborators(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error fetching project:', error);
      return null;
    }
  },

  async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client' | 'collaboratori'>): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          client:clients(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error creating project:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          client:clients(*),
          collaboratori:project_collaborators(
            *,
            collaborator:collaborators(*)
          )
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error updating project:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.warn('Error deleting project:', error);
      throw error;
    }
  },

  async getActiveProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*),
          collaboratori:project_collaborators(
            *,
            collaborator:collaborators(*)
          )
        `)
        .in('stato', ['pianificazione', 'in_corso'])
        .order('priorita', { ascending: false })
        .order('data_inizio', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Error fetching active projects:', error);
      return [];
    }
  }
};