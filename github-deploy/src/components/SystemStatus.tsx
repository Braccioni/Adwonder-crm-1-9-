/**
 * Componente per visualizzare lo stato del sistema
 */

import React, { useState } from 'react';
import { useSystemHealth, SystemHealth, HealthStatus } from '../utils/healthCheck';
import { getConnectionStatus, enableMockData, resetConnectionStatus } from '../config/environment';
import LogViewer from './LogViewer';
import { errorHandler } from '../utils/errorHandler';

interface SystemStatusProps {
  showDetails?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<{ status: 'healthy' | 'degraded' | 'unhealthy' }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return '●';
      case 'degraded': return '◐';
      case 'unhealthy': return '●';
      default: return '○';
    }
  };

  return (
    <span className={`inline-flex items-center ${getStatusColor()}`}>
      <span className="mr-1">{getStatusIcon()}</span>
      <span className="capitalize">{status}</span>
    </span>
  );
};

const ServiceStatus: React.FC<{ service: HealthStatus }> = ({ service }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <div className="flex items-center space-x-2">
        <span className="font-medium capitalize">{service.service}</span>
        <StatusIndicator status={service.status} />
      </div>
      <div className="text-sm text-gray-500">
        {service.responseTime && (
          <span className="mr-2">{service.responseTime}ms</span>
        )}
        <span>{new Date(service.lastCheck).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export const SystemStatus: React.FC<SystemStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { health, loading, refresh } = useSystemHealth();
  const [showMockDataToggle, setShowMockDataToggle] = React.useState(false);
  const [showLogViewer, setShowLogViewer] = useState(false);

  const handleToggleMockData = () => {
    const connectionStatus = getConnectionStatus();
    const shouldEnable = connectionStatus.status !== 'connected';
    
    enableMockData(shouldEnable);
    resetConnectionStatus();
    
    // Refresh health check
    setTimeout(() => {
      refresh();
    }, 100);
  };

  const handleRetryConnection = () => {
    resetConnectionStatus();
    refresh();
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-500">Checking system status...</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-red-500">●</span>
        <span className="text-sm text-red-600">System status unavailable</span>
        <button 
          onClick={refresh}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const connectionStatus = getConnectionStatus();
  const isSupabaseDown = health.services.find(s => s.service === 'supabase')?.status !== 'healthy';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status principale */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <StatusIndicator status={health.overall} />
          <span className="text-sm font-medium">System Status</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isSupabaseDown && (
            <button
              onClick={handleRetryConnection}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Retry Connection
            </button>
          )}
          
          <button
            onClick={() => setShowMockDataToggle(!showMockDataToggle)}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            ⚙️
          </button>
          
          <button
            onClick={refresh}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Avviso per Supabase down */}
      {isSupabaseDown && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">Database Connection Issue</p>
              <p className="text-yellow-700">
                Using mock data for development. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle per mock data */}
      {showMockDataToggle && (
        <div className="bg-gray-50 border border-gray-200 rounded p-2">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">Development Mode</p>
              <p className="text-gray-600">Force mock data usage</p>
            </div>
            <button
              onClick={handleToggleMockData}
              className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
            >
              {connectionStatus.status === 'connected' ? 'Enable Mock Data' : 'Try Real Data'}
            </button>
          </div>
        </div>
      )}

      {/* Dettagli servizi */}
      {showDetails && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-700">Services:</p>
          {health.services.map((service, index) => (
            <ServiceStatus key={index} service={service} />
          ))}
          
          {/* Informazioni aggiuntive */}
          <div className="text-xs text-gray-500 mt-2">
            <p>Last updated: {new Date(health.timestamp).toLocaleString()}</p>
            <p>Supabase configured: {connectionStatus.isConfigured ? 'Yes' : 'No'}</p>
          </div>
          
          {/* Pulsanti per debugging */}
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => setShowLogViewer(true)}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Visualizza Log
            </button>
            
            <button
              onClick={() => {
                const errorLogs = errorHandler.exportErrorLogs();
                const blob = new Blob([errorLogs], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `error_logs_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Esporta Errori
            </button>
          </div>
        </div>
      )}
      
      <LogViewer 
        isOpen={showLogViewer} 
        onClose={() => setShowLogViewer(false)} 
      />
    </div>
  );
};

export default SystemStatus;