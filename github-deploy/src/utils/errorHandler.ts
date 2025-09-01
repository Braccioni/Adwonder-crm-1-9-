import toast from 'react-hot-toast';
import { logger, LogLevel } from './logger';

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown; // ✅ Già corretto
}

export class AppError extends Error {
  code?: string;
  details?: unknown; // ✅ Già corretto

  constructor(message: string, code?: string, details?: unknown) { // ✅ Già corretto
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export const errorHandler = {
  // Per operazioni di lettura (GET)
  handleReadError(error: unknown, operation: string, fallbackValue: unknown = null) {
    const errorObj = error as any;
    
    // Log dell'errore con contesto dettagliato
    if (errorObj?.code === 'PGRST116') {
      // Record non trovato - comportamento normale, log come debug
      logger.debug(`Record not found in ${operation}`, 'database', {
        operation,
        code: errorObj.code,
        message: errorObj.message
      });
    } else {
      // Altri errori di lettura - log come warning
      logger.warn(`Read operation failed: ${operation}`, 'database', {
        operation,
        error: errorObj,
        fallbackUsed: fallbackValue !== null
      });
    }
    
    return fallbackValue;
  },

  // Per operazioni di scrittura (CREATE, UPDATE, DELETE)
  handleWriteError(error: unknown, operation: string, showToast: boolean = true) {
    const errorObj = error as any;
    
    // Log dell'errore con livello appropriato
    const isNetworkError = errorObj?.name === 'NetworkError' || errorObj?.code === 'NETWORK_ERROR';
    const isValidationError = errorObj?.message?.includes('Validation failed');
    const isConfigError = errorObj?.message?.includes('Database not configured');
    
    if (isValidationError) {
      logger.warn(`Validation error in ${operation}`, 'validation', {
        operation,
        error: errorObj,
        validationErrors: errorObj.message
      });
    } else if (isConfigError) {
      logger.error(`Configuration error in ${operation}`, 'config', {
        operation,
        error: errorObj
      });
    } else if (isNetworkError) {
      logger.error(`Network error in ${operation}`, 'network', {
        operation,
        error: errorObj
      });
    } else {
      logger.error(`Write operation failed: ${operation}`, 'database', {
        operation,
        error: errorObj
      }, errorObj instanceof Error ? errorObj : undefined);
    }
    
    if (showToast) {
      const message = errorObj?.message || 'Errore imprevisto';
      toast.error(`Errore ${operation}: ${message}`);
    }
    
    throw new AppError(
      errorObj?.message || `Failed to ${operation}`,
      errorObj?.code,
      errorObj
    );
  },

  // Per successi
  handleSuccess(operation: string, showToast: boolean = true) {
    // Log del successo
    logger.info(`Operation completed successfully: ${operation}`, 'success', {
      operation,
      timestamp: new Date().toISOString()
    });
    
    if (showToast) {
      const messages: Record<string, string> = {
        create: 'Elemento creato con successo!',
        update: 'Elemento aggiornato con successo!',
        delete: 'Elemento eliminato con successo!'
      };
      toast.success(messages[operation] || 'Operazione completata!');
    }
  },
  
  // Nuovi metodi per logging avanzato
  logApiCall(method: string, url: string, status: number, duration: number, error?: Error) {
    logger.logApiCall(method, url, status, duration, error);
  },
  
  logUserAction(action: string, data?: unknown) {
    logger.logUserAction(action, data);
  },
  
  logPerformanceIssue(operation: string, duration: number, threshold: number = 1000) {
    if (duration > threshold) {
      logger.warn(`Performance issue detected: ${operation}`, 'performance', {
        operation,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        slowBy: `${duration - threshold}ms`
      });
    }
  },
  
  logSecurityEvent(event: string, data?: unknown) {
    logger.critical(`Security event: ${event}`, 'security', data);
  },
  
  // Metodi per debugging
  getRecentErrors(minutes: number = 60) {
    return logger.getRecentLogs(minutes).filter(log => log.level >= LogLevel.ERROR);
  },
  
  exportErrorLogs() {
    const errorLogs = logger.getStoredLogs().filter(log => log.level >= LogLevel.ERROR);
    return JSON.stringify(errorLogs, null, 2);
  },
  
  clearErrorLogs() {
    logger.clearStoredLogs();
  }
};