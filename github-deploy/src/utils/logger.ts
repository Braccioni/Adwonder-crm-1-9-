export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private storageKey = 'app_logs';
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      enableRemoteLogging: false,
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    this.cleanupOldLogs();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private createLogEntry(level: LogLevel, message: string, context?: string, data?: unknown, error?: Error): LogEntry {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    if (error) {
      entry.stack = error.stack;
    }

    return entry;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${LogLevel[entry.level]}]`;
    const message = entry.context ? `${prefix} [${entry.context}] ${entry.message}` : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.data);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  private logToStorage(entry: LogEntry): void {
    if (!this.config.enableStorage || typeof window === 'undefined') return;

    try {
      const existingLogs = this.getStoredLogs();
      const updatedLogs = [entry, ...existingLogs].slice(0, this.config.maxStorageEntries);
      localStorage.setItem(this.storageKey, JSON.stringify(updatedLogs));
    } catch (error) {
      console.warn('Failed to store log entry:', error);
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemoteLogging || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          sessionId: this.sessionId,
          environment: process.env.NODE_ENV
        })
      });
    } catch (error) {
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, data, error);
    
    this.logToConsole(entry);
    this.logToStorage(entry);
    
    if (level >= LogLevel.ERROR) {
      this.logToRemote(entry);
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: unknown, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  critical(message: string, context?: string, data?: unknown, error?: Error): void {
    this.log(LogLevel.CRITICAL, message, context, data, error);
  }

  // Metodi di utilità
  getStoredLogs(): LogEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('Failed to retrieve stored logs:', error);
      return [];
    }
  }

  clearStoredLogs(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear stored logs:', error);
    }
  }

  exportLogs(): string {
    const logs = this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.getStoredLogs().filter(log => log.level === level);
  }

  getLogsByContext(context: string): LogEntry[] {
    return this.getStoredLogs().filter(log => log.context === context);
  }

  getRecentLogs(minutes: number = 60): LogEntry[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    return this.getStoredLogs().filter(log => log.timestamp >= cutoff);
  }

  private cleanupOldLogs(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const logs = this.getStoredLogs();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentLogs = logs.filter(log => log.timestamp >= oneDayAgo);
      
      if (recentLogs.length !== logs.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(recentLogs));
      }
    } catch (error) {
      console.warn('Failed to cleanup old logs:', error);
    }
  }

  // Metodi per performance monitoring
  startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.debug(`Timer: ${label}`, 'performance', { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // Metodi per API monitoring
  logApiCall(method: string, url: string, status: number, duration: number, error?: Error): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${method} ${url} - ${status} (${duration}ms)`;
    
    this.log(level, message, 'api', {
      method,
      url,
      status,
      duration,
      success: status < 400
    }, error);
  }

  // Metodi per user actions
  logUserAction(action: string, data?: unknown): void {
    this.info(`User action: ${action}`, 'user', data);
  }

  // Configurazione dinamica
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
    this.info(`Log level changed to ${LogLevel[level]}`, 'config');
  }

  enableRemoteLogging(endpoint: string): void {
    this.config.enableRemoteLogging = true;
    this.config.remoteEndpoint = endpoint;
    this.info('Remote logging enabled', 'config', { endpoint });
  }

  disableRemoteLogging(): void {
    this.config.enableRemoteLogging = false;
    this.info('Remote logging disabled', 'config');
  }
}

// Istanza globale del logger
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000,
  enableRemoteLogging: false
});

// Hook per React components
export const useLogger = () => {
  return logger;
};

// Utility functions
export const logError = (error: Error, context?: string, data?: unknown) => {
  logger.error(error.message, context, data, error);
};

export const logApiError = (error: Error, method: string, url: string, status?: number) => {
  logger.logApiCall(method, url, status || 0, 0, error);
};

export const logPerformance = (label: string, fn: () => void | Promise<void>) => {
  const timer = logger.startTimer(label);
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(timer);
  } else {
    timer();
    return result;
  }
};