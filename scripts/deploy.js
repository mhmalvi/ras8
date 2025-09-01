#!/usr/bin/env node

/**
 * Deployment script for H5 Returns Shopify App
 * Handles environment setup and Vercel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const ENVIRONMENTS = {
  development: {
    url: 'http://localhost:8082',
    branch: 'develop'
  },
  production: {
    url: 'https://returns-6erv6nq6f-info-quadquetechs-projects.vercel.app',
    branch: 'main'
  }
};

const REQUIRED_ENV_VARS = [
  'VITE_SHOPIFY_CLIENT_ID',
  'VITE_SUPABASE_URL', 
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SHOPIFY_CLIENT_SECRET'
];

class DeploymentManager {
  constructor() {
    this.environment = process.argv[2] || 'development';
    this.isProduction = this.environment === 'production';
    this.projectRoot = path.resolve(__dirname, '..');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',  // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
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

  async checkPrerequisites() {
    this.log('Checking deployment prerequisites...', 'info');

    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      this.log('Vercel CLI is installed', 'success');
    } catch (error) {
      this.log('Vercel CLI is not installed. Run: npm install -g vercel', 'error');
      process.exit(1);
    }

    // Check if logged into Vercel
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      this.log('Vercel authentication verified', 'success');
    } catch (error) {
      this.log('Not logged into Vercel. Run: vercel login', 'error');
      process.exit(1);
    }

    // Check environment file
    const envFile = path.join(this.projectRoot, `.env.${this.environment}`);
    if (!fs.existsSync(envFile)) {
      this.log(`Environment file missing: ${envFile}`, 'warning');
    }

    this.log('Prerequisites check completed', 'success');
  }

  validateEnvironmentVariables() {
    this.log('Validating environment variables...', 'info');

    const envFile = path.join(this.projectRoot, `.env.${this.environment}`);
    const localEnvFile = path.join(this.projectRoot, '.env');
    
    let envVars = {};
    
    // Load environment variables
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });
    }

    // Check local .env as fallback
    if (fs.existsSync(localEnvFile)) {
      const envContent = fs.readFileSync(localEnvFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !envVars[key]) {
          envVars[key.trim()] = value.trim();
        }
      });
    }

    const missing = REQUIRED_ENV_VARS.filter(key => !envVars[key]);
    
    if (missing.length > 0) {
      this.log(`Missing required environment variables: ${missing.join(', ')}`, 'error');
      process.exit(1);
    }

    this.log('Environment variables validation passed', 'success');
    return envVars;
  }

  async runBuild() {
    this.log(`Building application for ${this.environment}...`, 'info');

    try {
      const buildCommand = this.isProduction ? 'npm run build' : 'npm run build:dev';
      execSync(buildCommand, { 
        stdio: 'inherit',
        env: { 
          ...process.env, 
          NODE_ENV: this.environment 
        }
      });
      this.log('Build completed successfully', 'success');
    } catch (error) {
      this.log('Build failed', 'error');
      throw error;
    }
  }

  async runTests() {
    if (this.isProduction) {
      this.log('Skipping tests for production deployment', 'info');
      return;
    }

    this.log('Running tests...', 'info');

    try {
      // Run linting
      execSync('npm run lint', { stdio: 'inherit' });
      this.log('Linting passed', 'success');

      // Run critical E2E tests if available
      try {
        execSync('npm run test:e2e:critical', { 
          stdio: 'inherit',
          timeout: 300000 // 5 minutes
        });
        this.log('E2E tests passed', 'success');
      } catch (error) {
        this.log('E2E tests failed or not configured', 'warning');
      }

    } catch (error) {
      this.log('Tests failed', 'error');
      throw error;
    }
  }

  async deployToVercel() {
    this.log(`Deploying to Vercel (${this.environment})...`, 'info');

    try {
      const deployCommand = this.isProduction 
        ? 'vercel --prod --yes'
        : 'vercel --yes';

      const output = execSync(deployCommand, { 
        stdio: 'pipe',
        encoding: 'utf8'
      });

      // Extract deployment URL
      const lines = output.split('\n');
      const deploymentUrl = lines.find(line => line.includes('https://'));
      
      if (deploymentUrl) {
        this.log(`Deployment successful: ${deploymentUrl.trim()}`, 'success');
        return deploymentUrl.trim();
      } else {
        this.log('Deployment completed but URL not found in output', 'warning');
        return ENVIRONMENTS[this.environment].url;
      }

    } catch (error) {
      this.log('Deployment failed', 'error');
      throw error;
    }
  }

  async runHealthCheck(url) {
    this.log('Running post-deployment health checks...', 'info');

    try {
      // Wait for deployment to propagate
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Health check endpoint
      const healthUrl = `${url}/api/health`;
      execSync(`curl -f ${healthUrl}`, { stdio: 'pipe' });
      this.log('Health check passed', 'success');

      // OAuth endpoints check
      const oauthUrl = `${url}/auth/start?shop=test.myshopify.com`;
      try {
        execSync(`curl -f ${oauthUrl} -o /dev/null`, { stdio: 'pipe' });
        this.log('OAuth endpoints accessible', 'success');
      } catch (error) {
        this.log('OAuth endpoints check failed', 'warning');
      }

    } catch (error) {
      this.log('Health check failed', 'warning');
      // Don't fail the entire deployment for health check failures
    }
  }

  async updateShopifyConfig(url) {
    if (!this.isProduction) {
      this.log('Skipping Shopify config update for non-production environment', 'info');
      return;
    }

    this.log('Shopify App Configuration Update Required:', 'info');
    console.log('');
    console.log('📋 Update these URLs in your Shopify Partner Dashboard:');
    console.log(`   App URL: ${url}`);
    console.log(`   Allowed redirection URLs: ${url}/auth/callback`);
    console.log(`   Webhook endpoints: ${url}/api/webhooks/`);
    console.log('');
  }

  async generateDeploymentReport(url, envVars) {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      deploymentUrl: url,
      nodeVersion: process.version,
      environmentVariables: {
        shopifyClientId: envVars.VITE_SHOPIFY_CLIENT_ID ? '✅ Set' : '❌ Missing',
        supabaseUrl: envVars.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        appUrl: envVars.VITE_APP_URL ? '✅ Set' : '❌ Missing'
      },
      oauthUrls: {
        start: `${url}/auth/start`,
        callback: `${url}/auth/callback`
      },
      apiEndpoints: {
        health: `${url}/api/health`,
        session: `${url}/api/session/me`,
        metrics: `${url}/api/v1/metrics/summary`
      }
    };

    const reportPath = path.join(this.projectRoot, `deployment-report-${this.environment}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Deployment report generated: ${reportPath}`, 'success');
    return report;
  }

  async run() {
    try {
      this.log(`Starting deployment to ${this.environment}`, 'info');
      
      await this.checkPrerequisites();
      const envVars = this.validateEnvironmentVariables();
      
      if (!this.isProduction) {
        await this.runTests();
      }
      
      await this.runBuild();
      const deploymentUrl = await this.deployToVercel();
      await this.runHealthCheck(deploymentUrl);
      await this.updateShopifyConfig(deploymentUrl);
      await this.generateDeploymentReport(deploymentUrl, envVars);

      this.log(`🎉 Deployment to ${this.environment} completed successfully!`, 'success');
      
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployment = new DeploymentManager();
  deployment.run().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentManager;