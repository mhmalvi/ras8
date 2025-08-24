/**
 * Environment variable debugging utility
 * Helps diagnose environment variable loading issues
 */

export interface EnvStatus {
  name: string;
  value: string | undefined;
  present: boolean;
  masked: boolean;
}

export function debugEnvironment(): EnvStatus[] {
  const envVars = [
    'VITE_SHOPIFY_CLIENT_ID',
    'VITE_APP_URL', 
    'VITE_DEV_MODE',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  return envVars.map(name => {
    const value = import.meta.env[name];
    const present = value !== undefined && value !== null && value !== '';
    const masked = name.includes('KEY') || name.includes('SECRET');
    
    return {
      name,
      value: masked && present ? '***MASKED***' : value,
      present,
      masked
    };
  });
}

export function logEnvironmentStatus(): void {
  console.group('🔍 Environment Variables Status');
  
  const envStatus = debugEnvironment();
  
  envStatus.forEach(({ name, value, present, masked }) => {
    const status = present ? '✅' : '❌';
    const displayValue = masked ? value : (present ? `"${value}"` : 'Not Set');
    
    console.log(`${status} ${name}:`, displayValue);
  });
  
  // Additional Vite env info
  console.log('\n📋 Vite Environment Info:');
  console.log('Mode:', import.meta.env.MODE);
  console.log('Dev:', import.meta.env.DEV);
  console.log('Prod:', import.meta.env.PROD);
  console.log('Base URL:', import.meta.env.BASE_URL);
  
  console.groupEnd();
}

export function validateCriticalEnvVars(): { valid: boolean; missing: string[] } {
  const critical = [
    'VITE_SHOPIFY_CLIENT_ID',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = critical.filter(name => {
    const value = import.meta.env[name];
    return !value || value.trim() === '';
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}