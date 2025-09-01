import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up global test environment...');
  
  // Clean up test data if needed
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Optional: Clean up test data directory
  const testDataDir = path.join(__dirname, 'test-data');
  if (fs.existsSync(testDataDir)) {
    // Only clean up if explicitly requested
    if (process.env.CLEANUP_TEST_DATA === 'true') {
      fs.rmSync(testDataDir, { recursive: true, force: true });
      console.log('🗑️  Test data directory cleaned');
    }
  }
  
  // Log test completion
  console.log('✅ Global test teardown completed');
}

export default globalTeardown;