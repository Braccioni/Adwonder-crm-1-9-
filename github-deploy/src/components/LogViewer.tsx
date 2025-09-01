import React, { useState, useEffect } from 'react';
import { logger, LogLevel, LogEntry } from '../utils/logger';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedContext, setSelectedContext] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen) {
      interval = setInterval(loadLogs, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  useEffect(() => {
    filterLogs();
  }, [logs, selectedLevel, selectedContext, searchTerm]);

  const loadLogs = () => {
    const allLogs = logger.getStoredLogs();
    setLogs(allLogs);
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filtra per livello
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filtra per contesto
    if (selectedContext !== 'all') {
      filtered = filtered.filter(log => log.context === selectedContext);
    }

    // Filtra per termine di ricerca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        (log.context && log.context.toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  };

  const getUniqueContexts = () => {
    const contexts = logs
      .map(log => log.context)
      .filter((context, index, array) => context && array.indexOf(context) === index)
      .sort();
    return contexts as string[];
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return 'text-gray-500';
      case LogLevel.INFO:
        return 'text-blue-600';
      case LogLevel.WARN:
        return 'text-yellow-600';
      case LogLevel.ERROR:
        return 'text-red-600';
      case LogLevel.CRITICAL:
        return 'text-red-800 font-bold';
      default:
        return 'text-gray-600';
    }
  };

  const getLevelBadgeColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return 'bg-gray-100 text-gray-800';
      case LogLevel.INFO:
        return 'bg-blue-100 text-blue-800';
      case LogLevel.WARN:
        return 'bg-yellow-100 text-yellow-800';
      case LogLevel.ERROR:
        return 'bg-red-100 text-red-800';
      case LogLevel.CRITICAL:
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (window.confirm('Sei sicuro di voler cancellare tutti i log?')) {
      logger.clearStoredLogs();
      setLogs([]);
      setFilteredLogs([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Log Viewer</h2>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh</span>
            </label>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Livello:</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">Tutti</option>
                <option value={LogLevel.DEBUG}>Debug</option>
                <option value={LogLevel.INFO}>Info</option>
                <option value={LogLevel.WARN}>Warning</option>
                <option value={LogLevel.ERROR}>Error</option>
                <option value={LogLevel.CRITICAL}>Critical</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Contesto:</label>
              <select
                value={selectedContext}
                onChange={(e) => setSelectedContext(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">Tutti</option>
                {getUniqueContexts().map(context => (
                  <option key={context} value={context}>{context}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Cerca:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca nei messaggi..."
                className="border rounded px-2 py-1 text-sm w-48"
              />
            </div>

            <div className="flex space-x-2 ml-auto">
              <button
                onClick={loadLogs}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Aggiorna
              </button>
              <button
                onClick={exportLogs}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Esporta
              </button>
              <button
                onClick={clearLogs}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Cancella
              </button>
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            Mostrando {filteredLogs.length} di {logs.length} log
          </div>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nessun log trovato
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelBadgeColor(log.level)}`}>
                        {LogLevel[log.level]}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.context && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                            {log.context}
                          </span>
                        )}
                      </div>
                      
                      <div className={`mt-1 ${getLevelColor(log.level)}`}>
                        {log.message}
                      </div>
                      
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Mostra dati
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                            {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-500 cursor-pointer hover:text-red-700">
                            Mostra stack trace
                          </summary>
                          <pre className="mt-1 text-xs bg-red-50 p-2 rounded overflow-auto max-h-32 text-red-700">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;