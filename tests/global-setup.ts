import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up global test environment...');
  
  // Set test environment variables if not already set
  if (!process.env.VITE_APP_URL) {
    process.env.VITE_APP_URL = 'http://localhost:8082';
  }
  
  // Validate test environment
  const requiredEnvVars = [
    'VITE_SHOPIFY_CLIENT_ID',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables for full testing:', missingVars.join(', '));
    console.warn('Some tests may be skipped or use mock data.');
  }
  
  // Health check - ensure the app is running
  try {
    const response = await fetch(process.env.VITE_APP_URL || 'http://localhost:8082');
    if (!response.ok) {
      throw new Error(`App server returned ${response.status}`);
    }
    console.log('✅ App server is healthy');
  } catch (error) {
    console.error('❌ App server health check failed:', error);
    throw new Error('App server is not running. Please start it with `npm run dev`');
  }
  
  // Create test data directory
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const testDataDir = path.join(__dirname, 'test-data');
  
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  console.log('✅ Global test setup completed');
}

export default globalSetup;