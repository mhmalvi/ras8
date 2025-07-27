/**
 * Production-safe logging utility
 * Automatically filters logs based on environment
 */

interface LogConfig {
  enableInProduction?: boolean;
  component?: string;
}

const isProduction = process.env.NODE_ENV === 'production';

export const productionLogger = {
  info: (message: string, data?: any, config?: LogConfig) => {
    if (!isProduction || config?.enableInProduction) {
      const prefix = config?.component ? `[${config.component}]` : '';
      console.log(`${prefix} ${message}`, data || '');
    }
  },

  warn: (message: string, data?: any, config?: LogConfig) => {
    if (!isProduction || config?.enableInProduction) {
      const prefix = config?.component ? `[${config.component}]` : '';
      console.warn(`${prefix} ${message}`, data || '');
    }
  },

  error: (message: string, data?: any, config?: LogConfig) => {
    // Always log errors, even in production
    const prefix = config?.component ? `[${config.component}]` : '';
    console.error(`${prefix} ${message}`, data || '');
  },

  debug: (message: string, data?: any, config?: LogConfig) => {
    // Debug logs only in development
    if (!isProduction) {
      const prefix = config?.component ? `[${config.component}]` : '';
      console.log(`🔍 DEBUG ${prefix} ${message}`, data || '');
    }
  }
};

// Legacy console.log wrapper for gradual migration
export const devLog = (message: string, data?: any) => {
  if (!isProduction) {
    console.log(message, data || '');
  }
};

export default productionLogger;