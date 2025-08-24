/**
 * Environment Variable Validation for H5 App
 * Validates required environment variables at application startup
 */

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    description: string;
    example?: string;
  };
}

const CLIENT_ENV_VARS: RequiredEnvVars = {
  // Client-side variables (accessible in browser)
  VITE_SHOPIFY_CLIENT_ID: {
    required: true,
    description: 'Shopify App Client ID from Partners Dashboard',
    example: '2da34c83e89f6645ad1fb2028c7532dd'
  },
  VITE_APP_URL: {
    required: true,
    description: 'Public URL where the app is accessible',
    example: 'https://ras-5.vercel.app'
  },
  VITE_SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL for client connections'
  },
  VITE_SUPABASE_ANON_KEY: {
    required: true,
    description: 'Supabase anonymous key for client connections'
  },
  VITE_DEV_MODE: {
    required: false,
    description: 'Development mode flag',
    example: 'true'
  }
};

const SERVER_ENV_VARS: RequiredEnvVars = {
  // Server-side variables (Edge Functions only)
  SHOPIFY_CLIENT_ID: {
    required: true,
    description: 'Shopify App Client ID for server functions'
  },
  SHOPIFY_CLIENT_SECRET: {
    required: true,
    description: 'Shopify App Client Secret for server functions',
    example: 'e993e23eed15e1cef5bd22b300fd062f'
  },
  SHOPIFY_WEBHOOK_SECRET: {
    required: true,
    description: 'Webhook secret for HMAC verification',
    example: 'your_webhook_secret_here'
  },
  SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL for server functions'
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    description: 'Supabase service role key for server functions'
  },
  VITE_APP_URL: {
    required: true,
    description: 'App URL for redirects and callbacks'
  }
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates environment variables for the application
 * @param environment - 'client' | 'server' | 'all'
 */
export function validateEnvironment(environment: 'client' | 'server' | 'all' = 'all'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Select appropriate environment variables based on context
  let envVarsToCheck: RequiredEnvVars = {};
  
  if (environment === 'client') {
    envVarsToCheck = CLIENT_ENV_VARS;
  } else if (environment === 'server') {
    envVarsToCheck = SERVER_ENV_VARS;
  } else {
    // For 'all', only check client vars in browser context (server vars are handled by Edge Functions)
    envVarsToCheck = { ...CLIENT_ENV_VARS };
    // Note: SERVER_ENV_VARS are handled by Supabase Edge Functions, not browser
  }
  
  Object.entries(envVarsToCheck).forEach(([varName, config]) => {
    const value = import.meta.env?.[varName] || (typeof process !== 'undefined' ? process?.env?.[varName] : undefined);
    
    if (config.required) {
      if (!value) {
        errors.push(
          `❌ Missing required environment variable: ${varName}\n` +
          `   Description: ${config.description}\n` +
          `   ${config.example ? `Example: ${varName}=${config.example}` : ''}`
        );
      } else if (value === 'your_webhook_secret_here' || value === 'CHANGE_ME') {
        warnings.push(
          `⚠️  Environment variable ${varName} appears to be using a placeholder value.\n` +
          `   Please set a proper value for production.`
        );
      }
    } else if (!value) {
      warnings.push(
        `ℹ️  Optional environment variable ${varName} not set.\n` +
        `   Description: ${config.description}`
      );
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates environment and throws error if invalid
 * Use this at application startup
 */
export function validateEnvironmentOrThrow(environment: 'client' | 'server' | 'all' = 'all'): void {
  const result = validateEnvironment(environment);
  
  if (!result.isValid) {
    const errorMessage = [
      '🚨 Environment Configuration Error',
      '',
      'The following required environment variables are missing or invalid:',
      '',
      ...result.errors,
      '',
      'Please check your .env.local file and ensure all required variables are set.',
      ''
    ].join('\n');
    
    console.error(errorMessage);
    throw new Error('Environment validation failed. Check console for details.');
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    result.warnings.forEach(warning => console.warn(warning));
  }
  
  console.log('✅ Environment validation passed');
}

/**
 * Gets a required environment variable or throws an error
 */
export function getRequiredEnv(varName: string): string {
  const value = import.meta.env?.[varName] || process?.env?.[varName];
  
  if (!value) {
    throw new Error(`Required environment variable ${varName} is not set`);
  }
  
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnv(varName: string, defaultValue: string): string {
  const value = import.meta.env?.[varName] || process?.env?.[varName];
  return value || defaultValue;
}

/**
 * Checks if we're in development mode
 */
export function isDevelopment(): boolean {
  return getOptionalEnv('VITE_DEV_MODE', 'false') === 'true' || 
         getOptionalEnv('NODE_ENV', 'development') === 'development';
}

/**
 * Creates a formatted environment report for debugging
 */
export function getEnvironmentReport(): string {
  const report = [
    '📋 Environment Configuration Report',
    '=' .repeat(50),
    ''
  ];
  
  // Use CLIENT_ENV_VARS for the report since this runs in browser
  Object.entries(CLIENT_ENV_VARS).forEach(([varName, config]) => {
    const value = import.meta.env?.[varName] || (typeof process !== 'undefined' ? process?.env?.[varName] : undefined);
    const status = value ? '✅ Set' : '❌ Missing';
    const maskedValue = value ? (value.length > 10 ? value.substring(0, 8) + '...' : value) : 'Not set';
    
    report.push(`${varName}:`);
    report.push(`  Status: ${status}`);
    report.push(`  Value: ${maskedValue}`);
    report.push(`  Description: ${config.description}`);
    report.push('');
  });
  
  return report.join('\n');
}