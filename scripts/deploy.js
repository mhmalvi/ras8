#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Deployment Helper Script\n');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

function runCommand(cmd, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: rootDir });
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return false;
  }
}

function checkEnv() {
  console.log('🔍 Checking environment...');
  runCommand('node scripts/validate-env.js', 'Validating environment variables');
}

function lint() {
  console.log('🔍 Running linter...');
  return runCommand('npm run lint', 'Checking code quality');
}

function test() {
  console.log('🧪 Running tests...');
  return runCommand('npm run test:run', 'Running test suite');
}

function build() {
  console.log('🔨 Building project...');
  return runCommand('npm run build', 'Creating production build');
}

function deployPreview() {
  console.log('🌐 Deploying to preview...');
  console.log('   Note: This requires "vercel login" first');
  return runCommand('npx vercel', 'Deploying to Vercel preview');
}

function deployProduction() {
  console.log('🚀 Deploying to production...');
  console.log('   Note: This requires "vercel login" first');
  return runCommand('npx vercel --prod', 'Deploying to Vercel production');
}

function gitDeploy() {
  console.log('📤 Deploying via Git...');
  
  // Check git status
  try {
    const status = execSync('git status --porcelain', { cwd: rootDir }).toString();
    if (status) {
      console.log('⚠️  You have uncommitted changes:');
      console.log(status);
      console.log('\n💡 Tip: Commit your changes first:');
      console.log('   git add .');
      console.log('   git commit -m "Your message"');
      return false;
    }
  } catch (error) {
    console.error('❌ Not a git repository or git not available');
    return false;
  }
  
  // Push to current branch
  console.log('📤 Pushing to remote...');
  return runCommand('git push', 'Pushing to GitHub (will trigger Vercel deployment)');
}

function showStatus() {
  console.log('📊 Project Status\n');
  console.log('─'.repeat(50));
  
  // Check environment
  checkEnv();
  
  // Show URLs
  console.log('\n🌐 URLs:');
  console.log('   Production: https://ras8.vercel.app');
  console.log('   Preview: https://ras8-git-deployment-ready-info-quadquetechs-projects.vercel.app');
  console.log('   Local: http://localhost:8082');
  
  // Show Vercel Dashboard
  console.log('\n📊 Vercel Dashboard:');
  console.log('   https://vercel.com/info-quadquetechs-projects/ras8');
  
  // Git status
  console.log('\n📦 Git Status:');
  try {
    const branch = execSync('git branch --show-current', { cwd: rootDir }).toString().trim();
    console.log(`   Current branch: ${branch}`);
    
    const status = execSync('git status --porcelain', { cwd: rootDir }).toString();
    if (status) {
      console.log('   ⚠️  Uncommitted changes present');
    } else {
      console.log('   ✅ Working directory clean');
    }
  } catch (error) {
    console.log('   ❌ Not a git repository');
  }
}

function showHelp() {
  console.log('Usage: node scripts/deploy.js [command]\n');
  console.log('Commands:');
  console.log('  status      - Show project status and URLs');
  console.log('  check       - Validate environment and configuration');
  console.log('  lint        - Run code linter');
  console.log('  test        - Run test suite');
  console.log('  build       - Create production build');
  console.log('  preview     - Deploy to Vercel preview (requires login)');
  console.log('  production  - Deploy to Vercel production (requires login)');
  console.log('  git         - Deploy via Git push');
  console.log('  full        - Run full deployment workflow (lint, test, build, deploy)');
  console.log('  help        - Show this help message');
  
  console.log('\n💡 Quick Start:');
  console.log('  1. node scripts/deploy.js check   (validate setup)');
  console.log('  2. node scripts/deploy.js build   (test build)');
  console.log('  3. node scripts/deploy.js git     (deploy via GitHub)');
}

// Execute command
switch (command) {
  case 'status':
    showStatus();
    break;
  case 'check':
    checkEnv();
    break;
  case 'lint':
    lint();
    break;
  case 'test':
    test();
    break;
  case 'build':
    build();
    break;
  case 'preview':
    deployPreview();
    break;
  case 'production':
    deployProduction();
    break;
  case 'git':
    gitDeploy();
    break;
  case 'full':
    console.log('🎯 Running full deployment workflow...\n');
    if (lint() && test() && build()) {
      console.log('\n✅ All checks passed! Ready to deploy.');
      console.log('   Run: node scripts/deploy.js production');
    } else {
      console.log('\n❌ Deployment workflow failed. Please fix issues above.');
      process.exit(1);
    }
    break;
  case 'help':
  default:
    showHelp();
    break;
}

console.log('\n');