import { supabase } from '../lib/supabase';
import { DashboardStats, Deal, Client } from '../types';
import { notificationService } from './notificationService';
import { logger } from '../utils/logger';
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

// Definire interfacce per i dati con join
interface DealWithClient extends Deal {
  clients?: Client;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const startTime = performance.now();
    logger.info('Starting dashboard stats retrieval', 'dashboard');
    
    try {
      // Get total clients
      const { count: total_clients, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      let totalClients = 0;
      if (clientsError) {
        if (!isTableMissingError(clientsError)) {
          logger.warn('Error fetching clients count', 'dashboard', { error: clientsError });
        } else {
          logger.debug('Clients table not configured', 'dashboard');
        }
      } else {
        totalClients = total_clients || 0;
        logger.debug('Clients count retrieved', 'dashboard', { count: totalClients });
      }

      // Get active deals
      const { count: active_deals, error: activeDealsError } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('stato_trattativa', 'in_corso');

      let activeDeals = 0;
      if (activeDealsError) {
        if (!isTableMissingError(activeDealsError)) {
          logger.warn('Error fetching active deals', 'dashboard', { error: activeDealsError });
        } else {
          logger.debug('Deals table not configured', 'dashboard');
        }
      } else {
        activeDeals = active_deals || 0;
        logger.debug('Active deals count retrieved', 'dashboard', { count: activeDeals });
      }

      // Get won deals
      const { count: won_deals, error: wonDealsError } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('stato_trattativa', 'vinta');

      let wonDeals = 0;
      if (wonDealsError) {
        if (!isTableMissingError(wonDealsError)) {
          console.warn('Error fetching won deals:', wonDealsError);
        }
      } else {
        wonDeals = won_deals || 0;
      }

      // Get lost deals
      const { count: lost_deals, error: lostDealsError } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('stato_trattativa', 'persa');

      let lostDeals = 0;
      if (lostDealsError) {
        if (!isTableMissingError(lostDealsError)) {
          console.warn('Error fetching lost deals:', lostDealsError);
        }
      } else {
        lostDeals = lost_deals || 0;
      }

      // Get total deal value (active deals)
      const { data: activeDealsData, error: dealValueError } = await supabase
        .from('deals')
        .select('valore_stimato')
        .eq('stato_trattativa', 'in_corso');

      let total_deal_value = 0;
      if (dealValueError) {
        if (!isTableMissingError(dealValueError) && !isColumnMissingError(dealValueError)) {
          console.warn('Error fetching deal values:', dealValueError);
        }
      } else {
        total_deal_value = activeDealsData?.reduce((sum, deal) => sum + deal.valore_stimato, 0) || 0;
      }

      // Get this week's activities
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { count: this_week_activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .gte('data_ora', weekStart.toISOString());

      let weekActivities = 0;
      if (activitiesError) {
        if (!isTableMissingError(activitiesError)) {
          console.warn('Error fetching activities:', activitiesError);
        }
      } else {
        weekActivities = this_week_activities || 0;
      }

      // Get notification counts
      let notificationCounts = { pending: 0, expiring_soon: 0 };
      try {
        notificationCounts = await notificationService.getNotificationCount();
      } catch (error) {
        console.warn('Error fetching notification counts:', error);
      }

      // Get best client by revenue (sum of won deals)
      const bestClientByRevenue = await this.getBestClientByRevenue();

      // Get best client by contract duration
      const bestClientByContractDuration = await this.getBestClientByContractDuration();

      // Get best sales performance
      const bestSalesPerformance = await this.getBestSalesPerformance();

      const stats = {
        total_clients: totalClients,
        active_deals: activeDeals,
        won_deals: wonDeals,
        lost_deals: lostDeals,
        total_deal_value,
        this_week_activities: weekActivities,
        pending_notifications: notificationCounts.pending,
        contracts_expiring_soon: notificationCounts.expiring_soon,
        best_client_by_revenue: bestClientByRevenue || undefined,
        best_client_by_contract_duration: bestClientByContractDuration || undefined,
        best_sales_performance: bestSalesPerformance || undefined
      };
      
      const duration = performance.now() - startTime;
      logger.info('Dashboard stats retrieved successfully', 'dashboard', {
        duration: `${duration.toFixed(2)}ms`,
        stats: {
          total_clients: totalClients,
          active_deals: activeDeals,
          total_deal_value
        }
      });
      
      // Log performance issue if too slow
      errorHandler.logPerformanceIssue('dashboard-stats', duration, 2000);
      
      return stats;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      logger.error('Dashboard stats retrieval failed', 'dashboard', {
        duration: `${duration.toFixed(2)}ms`,
        error: error.message || 'Unknown error'
      }, error instanceof Error ? error : undefined);
      
      const fallbackStats = {
        total_clients: 0,
        active_deals: 0,
        won_deals: 0,
        lost_deals: 0,
        total_deal_value: 0,
        this_week_activities: 0,
        pending_notifications: 0,
        contracts_expiring_soon: 0
      };
      
      logger.warn('Using fallback dashboard stats', 'dashboard', fallbackStats);
      return fallbackStats;
    }
  },

  async getBestClientByRevenue() {
    try {
      const { data: wonDeals } = await supabase
        .from('deals')
        .select(`
          valore_stimato,
          clients!inner(nome_azienda)
        `)
        .eq('stato_trattativa', 'vinta');

      if (!wonDeals || wonDeals.length === 0) return undefined;

      // Calcolare i ricavi per cliente
      const clientRevenue = wonDeals.reduce((acc: Record<string, number>, deal: any) => {
        const clientName = deal.clients?.nome_azienda;
        if (clientName && deal.valore_stimato) {
          acc[clientName] = (acc[clientName] || 0) + Number(deal.valore_stimato);
        }
        return acc;
      }, {} as Record<string, number>);

      const bestClient = Object.entries(clientRevenue).reduce((best, [name, revenue]) => 
        revenue > best.total_revenue ? { nome_azienda: name, total_revenue: revenue } : best,
        { nome_azienda: '', total_revenue: 0 }
      );

      return bestClient.nome_azienda ? bestClient : undefined;
    } catch (error) {
      console.warn('Error getting best client by revenue:', error);
      return undefined;
    }
  },

  async getBestClientByContractDuration() {
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('nome_azienda, durata_contratto_mesi')
        .not('durata_contratto_mesi', 'is', null)
        .order('durata_contratto_mesi', { ascending: false })
        .limit(1);

      if (!clients || clients.length === 0) return undefined;

      return {
        nome_azienda: clients[0].nome_azienda,
        contract_duration_months: clients[0].durata_contratto_mesi
      };
    } catch (error) {
      console.warn('Error getting best client by contract duration:', error);
      return undefined;
    }
  },

  async getBestSalesPerformance() {
    try {
      const { data: wonDeals } = await supabase
        .from('deals')
        .select('valore_stimato, data_apertura, oggetto_trattativa, clients!inner(nome_azienda)')
        .eq('stato_trattativa', 'vinta');

      if (!wonDeals || wonDeals.length === 0) return undefined;

      // Find best month
      const monthlyStats: Record<string, { deals_count: number; total_value: number }> = {};
      wonDeals.forEach((deal: any) => {
        if (deal.data_apertura && deal.valore_stimato) {
          const month = new Date(deal.data_apertura).toISOString().slice(0, 7);
          if (!monthlyStats[month]) {
            monthlyStats[month] = { deals_count: 0, total_value: 0 };
          }
          monthlyStats[month].deals_count++;
          monthlyStats[month].total_value += Number(deal.valore_stimato);
        }
      });

      const bestMonth = Object.entries(monthlyStats).reduce((best, [month, stats]) => 
        stats.deals_count > best.deals_count ? { month, ...stats } : best,
        { month: '', deals_count: 0, total_value: 0 }
      );

      // Find best day
      const dailyStats: Record<string, number> = {};
      wonDeals.forEach((deal: any) => {
        if (deal.data_apertura) {
          const date = deal.data_apertura.split('T')[0];
          dailyStats[date] = (dailyStats[date] || 0) + 1;
        }
      });

      const bestDay = Object.entries(dailyStats).reduce((best, [date, count]) => 
        count > best.deals_count ? { date, deals_count: count } : best,
        { date: '', deals_count: 0 }
      );

      // Find biggest deal
      const biggestDeal = wonDeals.reduce((biggest: any, deal: any) => {
        const currentValue = Number(deal.valore_stimato) || 0;
        const biggestValue = Number(biggest.valore_stimato) || 0;
        return currentValue > biggestValue ? deal : biggest;
      }, wonDeals[0] || {});

      return {
        best_month: bestMonth.month ? {
          month: bestMonth.month,
          deals_count: bestMonth.deals_count,
          total_value: bestMonth.total_value
        } : undefined,
        best_day: bestDay.date ? {
          date: bestDay.date,
          deals_count: bestDay.deals_count
        } : undefined,
        biggest_deal: biggestDeal.oggetto_trattativa ? {
          oggetto_trattativa: biggestDeal.oggetto_trattativa,
          valore_stimato: Number(biggestDeal.valore_stimato),
          client_name: biggestDeal.clients?.nome_azienda
        } : undefined
      };
    } catch (error) {
      console.warn('Error getting best sales performance:', error);
      return undefined;
    }
  }
};