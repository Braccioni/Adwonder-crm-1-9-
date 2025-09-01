import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { errorHandler } from '../utils/errorHandler';

// Usa un user_id fisso per il gestionale aperto
const ADMIN_USER_ID = 'admin-user';

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

export const notificationService = {
  async getPendingNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('user_id', ADMIN_USER_ID)
        .eq('letta', false)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Notifications table not configured yet. Returning empty array.');
          return [];
        }
        return errorHandler.handleReadError(error, 'fetch pending notifications', []);
      }
      return data || [];
    } catch (error: any) {
      console.warn('Notification service not available:', error);
      return [];
    }
  },

  // Get all notifications (read and unread) for the admin user
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          client:clients(nome_azienda)
        `)
        .eq('user_id', ADMIN_USER_ID)
        .order('data_notifica', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          console.warn('Notifications table not configured yet. Returning empty array.');
          return [];
        }
        return errorHandler.handleReadError(error, 'fetch all notifications', []);
      }

      return data?.map(notification => ({
        ...notification,
        nome_azienda: notification.client?.nome_azienda
      })) || [];
    } catch (error: any) {
      console.warn('Notification service not available:', error);
      return [];
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ letta: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        errorHandler.handleWriteError(error, 'mark notification as read');
      }
    } catch (error: any) {
      errorHandler.handleWriteError(error, 'mark notification as read');
    }
  },

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ letta: true, updated_at: new Date().toISOString() })
        .in('id', notificationIds);

      if (error) {
        errorHandler.handleWriteError(error, 'mark multiple notifications as read');
      }
    } catch (error: any) {
      errorHandler.handleWriteError(error, 'mark multiple notifications as read');
    }
  },

  // Generate notifications for all clients (manual trigger)
  async generateNotifications(): Promise<void> {
    try {
      const { error } = await supabase.rpc('generate_contract_notifications');

      if (error) {
        errorHandler.handleWriteError(error, 'generate notifications');
      } else {
        errorHandler.handleSuccess('Notifications generated successfully');
      }
    } catch (error: any) {
      errorHandler.handleWriteError(error, 'generate notifications');
    }
  },

  // Get notification count for dashboard
  async getNotificationCount(): Promise<{ pending: number; expiring_soon: number }> {
    try {
      let pendingCount = 0;
      let expiringCount = 0;

      // Get pending notifications count with better error handling
      try {
        const { count, error: pendingError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', ADMIN_USER_ID)
          .eq('letta', false)
          .lte('data_notifica', new Date().toISOString().split('T')[0]);

        if (pendingError) {
          if (isTableMissingError(pendingError)) {
            console.warn('Notifications table not configured yet.');
          } else {
            console.warn('Error fetching notifications:', pendingError.message);
          }
        } else {
          pendingCount = count || 0;
        }
      } catch (notificationError) {
        console.warn('Notifications service unavailable:', notificationError);
      }

      // Get contracts expiring in next 60 days with better error handling
      try {
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        const { count, error: expiringError } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', ADMIN_USER_ID)
          .not('data_scadenza_contratto', 'is', null)
          .gte('data_scadenza_contratto', new Date().toISOString().split('T')[0])
          .lte('data_scadenza_contratto', sixtyDaysFromNow.toISOString().split('T')[0]);

        if (expiringError) {
          if (isTableMissingError(expiringError) || isColumnMissingError(expiringError)) {
            console.warn('Clients table or contract expiration column not configured yet.');
          } else {
            console.warn('Error fetching contract expiration data:', expiringError.message);
          }
        } else {
          expiringCount = count || 0;
        }
      } catch (clientError) {
        console.warn('Client service unavailable:', clientError);
      }

      return {
        pending: pendingCount,
        expiring_soon: expiringCount
      };
    } catch (error: any) {
      console.warn('Notification count service not available:', error);
      return { pending: 0, expiring_soon: 0 };
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        errorHandler.handleWriteError(error, 'delete notification');
      } else {
        errorHandler.handleSuccess('Notification deleted successfully');
      }
    } catch (error: any) {
      errorHandler.handleWriteError(error, 'delete notification');
    }
  },

  // Get notifications for a specific client
  async getClientNotifications(clientId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', ADMIN_USER_ID)
        .eq('client_id', clientId)
        .order('data_notifica', { ascending: false });

      if (error) {
        return errorHandler.handleReadError(error, 'fetch client notifications', []);
      }

      return data || [];
    } catch (error: any) {
      return errorHandler.handleReadError(error, 'fetch client notifications', []);
    }
  }
};