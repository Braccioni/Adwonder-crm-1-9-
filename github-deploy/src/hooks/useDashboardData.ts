import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { dealService } from '../services/dealService';
import { DashboardStats, Deal } from '../types';
import { shouldUseMockData, mockDashboardStats, mockDeals, simulateApiDelay, shouldUseMockDataSync } from '../utils/mockData';
import { cacheManager } from '../utils/cacheManager';

interface DashboardData {
  stats: DashboardStats | null;
  recentDeals: Deal[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Controlla se abbiamo dati validi nella cache
      if (!forceRefresh) {
        const cachedStats = cacheManager.get<DashboardStats>('dashboard');
        const cachedDeals = cacheManager.get<Deal[]>('deals');
        
        if (cachedStats && cachedDeals) {
          setStats(cachedStats);
          setRecentDeals(cachedDeals.slice(0, 5));
          setLoading(false);
          return;
        }
      }

      // Controlla se usare mock data
      const useMockData = await shouldUseMockData();
      if (useMockData) {
        await simulateApiDelay(300);
        
        // Salva nella cache con dipendenze
        cacheManager.set('dashboard', mockDashboardStats, ['clients', 'deals', 'activities', 'notifications']);
        cacheManager.set('deals', mockDeals, ['clients']);
        
        setStats(mockDashboardStats);
        setRecentDeals(mockDeals.slice(0, 5));
        setLoading(false);
        return;
      }

      // Carica i dati reali con gestione degli errori migliorata
      const [statsData, dealsData] = await Promise.all([
        dashboardService.getStats().catch((err) => {
          console.warn('Error loading dashboard stats:', err);
          return mockDashboardStats; // Fallback ai mock data
        }),
        dealService.getAll().catch((err) => {
          console.warn('Error loading deals:', err);
          return mockDeals; // Fallback ai mock data
        })
      ]);
      
      // Salva nella cache con dipendenze
      cacheManager.set('dashboard', statsData, ['clients', 'deals', 'activities', 'notifications']);
      cacheManager.set('deals', dealsData, ['clients']);
      
      setStats(statsData);
      setRecentDeals(dealsData.slice(0, 5));
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError('Errore nel caricamento dei dati del dashboard');
      
      // Fallback ai mock data in caso di errore
      const fallbackStats = cacheManager.get<DashboardStats>('dashboard') || mockDashboardStats;
      const fallbackDeals = cacheManager.get<Deal[]>('deals') || mockDeals;
      
      setStats(fallbackStats);
      setRecentDeals(fallbackDeals.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadDashboardData(true);
  }, [loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    stats,
    recentDeals,
    loading,
    error,
    refreshData
  };
};

// Funzione per invalidare la cache del dashboard
export const invalidateDashboardCache = () => {
  cacheManager.invalidate('dashboard');
};

// Funzione per controllare se la cache del dashboard è valida
export const isDashboardCacheValid = (): boolean => {
  return cacheManager.has('dashboard');
};