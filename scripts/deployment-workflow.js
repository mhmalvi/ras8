#!/usr/bin/env node

/**
 * RAS8 Deployment Workflow Automation
 * Enhanced development workflow for Vercel, Git, and Shopify integration
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const config = {
  vercel: {
    projectName: 'ras8',
    production: true
  },
  git: {
    mainBranch: 'main',
    autoCommit: false
  },
  shopify: {
    appId: process.env.SHOPIFY_APP_ID
  }
};

class DeploymentWorkflow {
  constructor() {
    this.log = (message) => console.log(`🚀 [RAS8] ${message}`);
    this.error = (message) => console.error(`❌ [RAS8] ${message}`);
    this.success = (message) => console.log(`✅ [RAS8] ${message}`);
  }

  async runCommand(command, description) {
    try {
      this.log(`${description}...`);
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      return output.trim();
    } catch (error) {
      this.error(`Failed: ${description}`);
      throw error;
    }
  }

  async gitStatus() {
    const status = await this.runCommand('git status --porcelain', 'Checking git status');
    const log = await this.runCommand('git log --oneline -5', 'Getting recent commits');
    
    return {
      hasChanges: status.length > 0,
      changes: status.split('\n').filter(line => line.trim()),
      recentCommits: log.split('\n')
    };
  }

  async vercelDeploy(environment = 'production') {
    const deployCommand = environment === 'production' 
      ? 'npx vercel --prod --yes'
      : 'npx vercel --yes';
    
    const output = await this.runCommand(deployCommand, `Deploying to Vercel ${environment}`);
    
    // Extract deployment URL from output
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
    return urlMatch ? urlMatch[0] : null;
  }

  async shopifyInfo() {
    try {
      const output = await this.runCommand('npx @shopify/cli app info --json', 'Getting Shopify app info');
      return JSON.parse(output);
    } catch (error) {
      this.log('Shopify CLI not configured or app not found');
      return null;
    }
  }

  async securityWorkflow() {
    this.log('Running security workflow...');
    
    // Run linting
    await this.runCommand('npm run lint', 'Running ESLint');
    this.success('Linting passed');
    
    // Run tests
    await this.runCommand('npm run test:run', 'Running test suite');
    this.success('Tests passed');
    
    // Build project
    await this.runCommand('npm run build', 'Building project');
    this.success('Build successful');
    
    return true;
  }

  async fullDeploymentWorkflow() {
    this.log('Starting full deployment workflow...');
    
    try {
      // 1. Check git status
      const gitInfo = await this.gitStatus();
      this.log(`Git status: ${gitInfo.hasChanges ? 'Has changes' : 'Clean'}`);
      this.log(`Recent commits: ${gitInfo.recentCommits.length}`);
      
      // 2. Run security checks
      await this.securityWorkflow();
      
      // 3. Deploy to Vercel
      const deploymentUrl = await this.vercelDeploy('production');
      if (deploymentUrl) {
        this.success(`Deployed to: ${deploymentUrl}`);
      }
      
      // 4. Get Shopify app info
      const shopifyInfo = await this.shopifyInfo();
      if (shopifyInfo) {
        this.log(`Shopify app: ${shopifyInfo.name || 'RAS8'}`);
      }
      
      this.success('Full deployment workflow completed!');
      
    } catch (error) {
      this.error(`Workflow failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI Interface
const workflow = new DeploymentWorkflow();
const command = process.argv[2];

switch (command) {
  case 'status':
    workflow.gitStatus().then(info => {
      console.log('Git Status:', info);
    });
    break;
    
  case 'deploy':
    const env = process.argv[3] || 'production';
    workflow.vercelDeploy(env).then(url => {
      console.log('Deployment URL:', url);
    });
    break;
    
  case 'shopify':
    workflow.shopifyInfo().then(info => {
      console.log('Shopify Info:', info);
    });
    break;
    
  case 'security':
    workflow.securityWorkflow();
    break;
    
  case 'full':
    workflow.fullDeploymentWorkflow();
    break;
    
  default:
    console.log(`
RAS8 Deployment Workflow Commands:

  node scripts/deployment-workflow.js status   - Check git status
  node scripts/deployment-workflow.js deploy   - Deploy to Vercel
  node scripts/deployment-workflow.js shopify  - Get Shopify app info
  node scripts/deployment-workflow.js security - Run security checks
  node scripts/deployment-workflow.js full     - Full deployment workflow

Package.json shortcuts:
  npm run mcp:git      - Git status and log
  npm run mcp:vercel   - Deploy to Vercel
  npm run mcp:shopify  - Shopify app info
  npm run deploy:all   - Build and deploy
  npm run workflow:security - Security checks
`);
}