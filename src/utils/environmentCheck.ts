/**
 * Environment Configuration Validation
 * Comprehensive check for all required environment variables
 */

interface EnvironmentStatus {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  info: Record<string, string>;
}

export const validateEnvironment = (): EnvironmentStatus => {
  const missing: string[] = [];
  const warnings: string[] = [];
  const info: Record<string, string> = {};

  // Required environment variables
  const requiredVars = {
    'VITE_SHOPIFY_CLIENT_ID': import.meta.env.VITE_SHOPIFY_CLIENT_ID,
    'VITE_APP_URL': import.meta.env.VITE_APP_URL,
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  // Check required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value || value.includes('your-') || value.includes('placeholder')) {
      missing.push(key);
    } else {
      info[key] = `✅ Set (${value.substring(0, 20)}...)`;
    }
  });

  // Check optional but important variables
  const optionalVars = {
    'VITE_DEV_MODE': import.meta.env.VITE_DEV_MODE,
  };

  Object.entries(optionalVars).forEach(([key, value]) => {
    if (value) {
      info[key] = `✅ Set`;
    } else {
      warnings.push(`${key} is not set (may cause issues in some flows)`);
    }
  });

  // Validate URLs
  if (requiredVars.VITE_APP_URL) {
    try {
      const url = new URL(requiredVars.VITE_APP_URL);
      if (url.hostname.includes('localhost')) {
        warnings.push('Using localhost URL - this won\'t work for Shopify webhooks');
      }
      if (url.protocol !== 'https:') {
        missing.push('VITE_APP_URL must use HTTPS for Shopify compatibility');
      }
    } catch {
      missing.push('VITE_APP_URL is not a valid URL');
    }
  }

  // Validate Supabase URL
  if (requiredVars.VITE_SUPABASE_URL) {
    try {
      const url = new URL(requiredVars.VITE_SUPABASE_URL);
      if (!url.hostname.includes('.supabase.co')) {
        warnings.push('VITE_SUPABASE_URL doesn\'t appear to be a valid Supabase URL');
      }
    } catch {
      missing.push('VITE_SUPABASE_URL is not a valid URL');
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    info
  };
};

export const logEnvironmentStatus = () => {
  const status = validateEnvironment();
  
  console.log('🔧 Environment Configuration Check:');
  console.log('=====================================');
  
  if (status.isValid) {
    console.log('✅ All required environment variables are set!');
  } else {
    console.error('❌ Missing required environment variables:');
    status.missing.forEach(key => console.error(`  - ${key}`));
  }
  
  if (status.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    status.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log('\n📊 Current Configuration:');
  Object.entries(status.info).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('=====================================');
  
  return status;
};