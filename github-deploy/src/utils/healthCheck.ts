/**
 * Sistema di health check per monitorare lo stato dei servizi
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getConnectionStatus, resetConnectionStatus } from '../config/environment';

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  error?: string;
  responseTime?: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthStatus[];
  timestamp: number;
}

// Cache per i risultati del health check
let lastHealthCheck: SystemHealth | null = null;
let healthCheckInProgress = false;
const HEALTH_CHECK_CACHE_DURATION = 30000; // 30 secondi

/**
 * Verifica lo stato di Supabase
 */
export const checkSupabaseHealth = async (): Promise<HealthStatus> => {
  const startTime = Date.now();
  
  try {
    // Test di connessione semplice
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1)
      .single();
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      // Controlla se è un errore di tabella mancante
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          service: 'supabase',
          status: 'degraded',
          lastCheck: Date.now(),
          error: 'Database tables not configured',
          responseTime
        };
      }
      
      return {
        service: 'supabase',
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message,
        responseTime
      };
    }
    
    return {
      service: 'supabase',
      status: 'healthy',
      lastCheck: Date.now(),
      responseTime
    };
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'supabase',
      status: 'unhealthy',
      lastCheck: Date.now(),
      error: error.message || 'Connection failed',
      responseTime
    };
  }
};

/**
 * Verifica lo stato generale del sistema
 */
export const checkSystemHealth = async (forceRefresh = false): Promise<SystemHealth> => {
  const now = Date.now();
  
  // Se abbiamo un check recente e non è forzato, usa quello
  if (!forceRefresh && 
      lastHealthCheck && 
      (now - lastHealthCheck.timestamp) < HEALTH_CHECK_CACHE_DURATION) {
    return lastHealthCheck;
  }
  
  // Se c'è già un check in corso, aspetta
  if (healthCheckInProgress) {
    // Aspetta un po' e riprova
    await new Promise(resolve => setTimeout(resolve, 100));
    if (lastHealthCheck) {
      return lastHealthCheck;
    }
  }
  
  healthCheckInProgress = true;
  
  try {
    // Esegui tutti i check in parallelo
    const [supabaseStatus] = await Promise.all([
      checkSupabaseHealth()
    ]);
    
    const services = [supabaseStatus];
    
    // Determina lo stato generale
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');
    
    if (unhealthyServices.length > 0) {
      overall = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overall = 'degraded';
    }
    
    const systemHealth: SystemHealth = {
      overall,
      services,
      timestamp: now
    };
    
    lastHealthCheck = systemHealth;
    return systemHealth;
    
  } finally {
    healthCheckInProgress = false;
  }
};

/**
 * Ottieni l'ultimo health check (senza eseguirne uno nuovo)
 */
export const getLastHealthCheck = (): SystemHealth | null => {
  return lastHealthCheck;
};

/**
 * Verifica se un servizio specifico è sano
 */
export const isServiceHealthy = async (serviceName: string): Promise<boolean> => {
  const health = await checkSystemHealth();
  const service = health.services.find(s => s.service === serviceName);
  return service?.status === 'healthy';
};

/**
 * Verifica se Supabase è disponibile e configurato
 */
export const isSupabaseReady = async (): Promise<boolean> => {
  const health = await checkSystemHealth();
  const supabase = health.services.find(s => s.service === 'supabase');
  return supabase?.status === 'healthy';
};

/**
 * Reset del cache del health check
 */
export const resetHealthCheck = (): void => {
  lastHealthCheck = null;
  healthCheckInProgress = false;
  resetConnectionStatus();
};

/**
 * Monitora continuamente lo stato del sistema
 */
export const startHealthMonitoring = (intervalMs: number = 60000): () => void => {
  const interval = setInterval(async () => {
    try {
      await checkSystemHealth(true);
    } catch (error) {
      console.warn('Health check failed:', error);
    }
  }, intervalMs);
  
  // Esegui un check iniziale
  checkSystemHealth(true).catch(error => {
    console.warn('Initial health check failed:', error);
  });
  
  // Restituisci una funzione per fermare il monitoring
  return () => {
    clearInterval(interval);
  };
};

/**
 * Hook per React per monitorare lo stato del sistema
 */
export const useSystemHealth = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    const updateHealth = async () => {
      try {
        const currentHealth = await checkSystemHealth();
        if (mounted) {
          setHealth(currentHealth);
          setLoading(false);
        }
      } catch (error) {
        console.error('Health check error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    updateHealth();
    
    // Aggiorna ogni minuto
    const interval = setInterval(updateHealth, 60000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  
  return { health, loading, refresh: () => checkSystemHealth(true) };
};