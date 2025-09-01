#!/usr/bin/env node

/**
 * Setup script for Vercel environment variables
 * Automates the process of setting up environment variables in Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class VercelEnvSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  async promptUser(question) {
    return new Promise(resolve => {
      this.rl.question(question, resolve);
    });
  }

  async loadEnvironmentFile() {
    const envFile = path.join(this.projectRoot, '.env');
    const envProdFile = path.join(this.projectRoot, '.env.production');
    
    let envVars = {};

    // Load from .env first
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    }

    // Override with production values if available
    if (fs.existsSync(envProdFile)) {
      const envContent = fs.readFileSync(envProdFile, 'utf8');
      envContent.split('\n').forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    }

    return envVars;
  }

  async getShopifyClientSecret() {
    this.log('Shopify Client Secret is required but not found in environment files.', 'warning');
    console.log('');
    console.log('To find your Shopify Client Secret:');
    console.log('1. Go to your Shopify Partner Dashboard');
    console.log('2. Navigate to Apps > Your App');
    console.log('3. Go to App setup');
    console.log('4. Copy the Client secret');
    console.log('');

    const secret = await this.promptUser('Enter your Shopify Client Secret: ');
    return secret.trim();
  }

  async getJWTSecret() {
    this.log('JWT Secret not found. Generating a secure random key...', 'info');
    const crypto = require('crypto');
    return `h5-prod-${crypto.randomBytes(32).toString('hex')}-${Date.now()}`;
  }

  async checkVercelAuth() {
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      return true;
    } catch (error) {
      this.log('Not logged into Vercel. Run: vercel login', 'error');
      return false;
    }
  }

  async setVercelEnvironmentVariable(key, value, environment = 'production') {
    try {
      const command = `vercel env add ${key} ${environment}`;
      const child = execSync(command, { 
        stdio: 'pipe', 
        input: value,
        encoding: 'utf8'
      });
      
      this.log(`✓ Set ${key} for ${environment}`, 'success');
      return true;
    } catch (error) {
      this.log(`✗ Failed to set ${key}: ${error.message}`, 'error');
      return false;
    }
  }

  async setupEnvironmentVariables() {
    this.log('Setting up Vercel environment variables...', 'info');

    const envVars = await this.loadEnvironmentFile();
    
    // Required environment variables for production
    const requiredVars = {
      'VITE_SHOPIFY_CLIENT_ID': envVars.VITE_SHOPIFY_CLIENT_ID || envVars.SHOPIFY_API_KEY,
      'VITE_SUPABASE_URL': envVars.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': envVars.VITE_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': envVars.SUPABASE_SERVICE_ROLE_KEY,
      'SUPABASE_ACCESS_TOKEN': envVars.SUPABASE_ACCESS_TOKEN,
      'VITE_APP_URL': 'https://returns-6erv6nq6f-info-quadquetechs-projects.vercel.app',
      'VITE_DEV_MODE': 'false',
      'NODE_ENV': 'production'
    };

    // Handle missing Shopify Client Secret
    if (!envVars.SHOPIFY_CLIENT_SECRET) {
      requiredVars.SHOPIFY_CLIENT_SECRET = await this.getShopifyClientSecret();
    } else {
      requiredVars.SHOPIFY_CLIENT_SECRET = envVars.SHOPIFY_CLIENT_SECRET;
    }

    // Handle JWT Secret
    if (!envVars.JWT_SECRET_KEY) {
      requiredVars.JWT_SECRET_KEY = await this.getJWTSecret();
    } else {
      requiredVars.JWT_SECRET_KEY = envVars.JWT_SECRET_KEY;
    }

    // Validate required vars
    const missingVars = Object.entries(requiredVars).filter(([key, value]) => !value);
    if (missingVars.length > 0) {
      this.log(`Missing required variables: ${missingVars.map(([k]) => k).join(', ')}`, 'error');
      return false;
    }

    console.log('');
    this.log('The following environment variables will be set in Vercel:', 'info');
    Object.entries(requiredVars).forEach(([key, value]) => {
      const maskedValue = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') 
        ? value.substring(0, 8) + '...' 
        : value;
      console.log(`  ${key}: ${maskedValue}`);
    });

    console.log('');
    const confirm = await this.promptUser('Continue with setting these variables? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      this.log('Setup cancelled', 'info');
      return false;
    }

    // Set environment variables for production
    let successCount = 0;
    for (const [key, value] of Object.entries(requiredVars)) {
      const success = await this.setVercelEnvironmentVariable(key, value, 'production');
      if (success) successCount++;
    }

    // Also set preview environment variables
    this.log('Setting preview environment variables...', 'info');
    const previewVars = {
      ...requiredVars,
      'VITE_DEV_MODE': 'true',
      'NODE_ENV': 'development'
    };

    for (const [key, value] of Object.entries(previewVars)) {
      await this.setVercelEnvironmentVariable(key, value, 'preview');
    }

    this.log(`Successfully configured ${successCount}/${Object.keys(requiredVars).length} environment variables`, 'success');
    return true;
  }

  async generateVercelConfig() {
    this.log('Updating vercel.json with current configuration...', 'info');

    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    let config = {};

    if (fs.existsSync(vercelConfigPath)) {
      config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    }

    // Update with optimized configuration
    const updatedConfig = {
      ...config,
      version: 2,
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      installCommand: 'npm ci',
      framework: 'vite',
      functions: {
        'api/**/*.js': {
          maxDuration: 30
        },
        'api/**/*.ts': {
          maxDuration: 30
        }
      },
      builds: [
        {
          src: 'package.json',
          use: '@vercel/static-build',
          config: {
            distDir: 'dist'
          }
        }
      ],
      rewrites: config.rewrites || [
        {
          source: '/auth/start',
          destination: '/api/auth/start'
        },
        {
          source: '/auth/callback',
          destination: '/api/auth/callback'
        },
        {
          source: '/((?!api/).*)',
          destination: '/index.html'
        }
      ],
      headers: config.headers || []
    };

    fs.writeFileSync(vercelConfigPath, JSON.stringify(updatedConfig, null, 2));
    this.log('vercel.json updated successfully', 'success');
  }

  async displayPostSetupInstructions() {
    console.log('');
    this.log('🎉 Vercel environment setup completed!', 'success');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('');
    console.log('1. Update your Shopify App URLs:');
    console.log('   App URL: https://returns-6erv6nq6f-info-quadquetechs-projects.vercel.app');
    console.log('   Allowed redirection URLs:');
    console.log('   • https://returns-6erv6nq6f-info-quadquetechs-projects.vercel.app/auth/callback');
    console.log('   • http://localhost:8082/auth/callback (for development)');
    console.log('');
    console.log('2. Deploy your app:');
    console.log('   npm run deploy:production');
    console.log('   # or');
    console.log('   vercel --prod');
    console.log('');
    console.log('3. Test OAuth flow:');
    console.log('   https://returns-6erv6nq6f-info-quadquetechs-projects.vercel.app/auth/start?shop=yourstore.myshopify.com');
    console.log('');
    console.log('4. Monitor deployment:');
    console.log('   - Check Vercel dashboard for deployment status');
    console.log('   - Monitor application logs');
    console.log('   - Run health checks');
    console.log('');
  }

  async run() {
    try {
      this.log('Starting Vercel environment setup...', 'info');

      if (!await this.checkVercelAuth()) {
        process.exit(1);
      }

      await this.setupEnvironmentVariables();
      await this.generateVercelConfig();
      await this.displayPostSetupInstructions();

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new VercelEnvSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = VercelEnvSetup;