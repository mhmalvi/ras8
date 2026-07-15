#!/usr/bin/env node

/**
 * Sentry Configuration Verification Script
 *
 * Checks that Sentry environment variables are properly configured
 * Run with: node scripts/verify-sentry-config.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);

  if (!fs.existsSync(envPath)) {
    return { exists: false, variables: {} };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const variables = {};

  // Parse environment variables
  content.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      variables[key] = value.trim();
    }
  });

  return { exists: true, variables };
}

function validateDSN(dsn) {
  if (!dsn) return false;

  // Check if it's a placeholder
  if (dsn.includes('your_') || dsn.includes('_here')) {
    return false;
  }

  // Check format: https://xxxxx@oxxxxx.ingest.sentry.io/xxxxxx
  const dsnPattern = /^https:\/\/[a-f0-9]+@o[0-9]+\.ingest\.sentry\.io\/[0-9]+$/;
  return dsnPattern.test(dsn);
}

function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Sentry Configuration Verification', colors.bold + colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  let hasErrors = false;
  let hasWarnings = false;

  // Check .env.local
  log('1. Checking .env.local (local development)...', colors.bold);
  const envLocal = checkEnvFile('.env.local');

  if (!envLocal.exists) {
    log('   ⚠️  .env.local not found', colors.yellow);
    log('   Create .env.local for local development', colors.yellow);
    log('   Hint: cp .env.example .env.local\n', colors.yellow);
    hasWarnings = true;
  } else {
    // Check SENTRY_DSN
    if (!envLocal.variables.SENTRY_DSN) {
      log('   ❌ SENTRY_DSN not found in .env.local', colors.red);
      hasErrors = true;
    } else if (!validateDSN(envLocal.variables.SENTRY_DSN)) {
      log('   ❌ SENTRY_DSN is invalid or placeholder', colors.red);
      log(`   Current value: ${envLocal.variables.SENTRY_DSN}`, colors.red);
      hasErrors = true;
    } else {
      log('   ✅ SENTRY_DSN configured correctly', colors.green);
    }

    // Check VITE_SENTRY_DSN
    if (!envLocal.variables.VITE_SENTRY_DSN) {
      log('   ❌ VITE_SENTRY_DSN not found in .env.local', colors.red);
      hasErrors = true;
    } else if (!validateDSN(envLocal.variables.VITE_SENTRY_DSN)) {
      log('   ❌ VITE_SENTRY_DSN is invalid or placeholder', colors.red);
      log(`   Current value: ${envLocal.variables.VITE_SENTRY_DSN}`, colors.red);
      hasErrors = true;
    } else {
      log('   ✅ VITE_SENTRY_DSN configured correctly', colors.green);
    }

    // Check optional VITE_SENTRY_ENABLED
    if (envLocal.variables.VITE_SENTRY_ENABLED === 'true') {
      log('   ℹ️  VITE_SENTRY_ENABLED set to true (development mode)', colors.cyan);
    }
  }

  log('');

  // Check .env.example
  log('2. Checking .env.example (template)...', colors.bold);
  const envExample = checkEnvFile('.env.example');

  if (!envExample.exists) {
    log('   ⚠️  .env.example not found', colors.yellow);
    hasWarnings = true;
  } else {
    if (envExample.variables.SENTRY_DSN) {
      log('   ✅ SENTRY_DSN template exists', colors.green);
    } else {
      log('   ⚠️  SENTRY_DSN not in template', colors.yellow);
      hasWarnings = true;
    }

    if (envExample.variables.VITE_SENTRY_DSN) {
      log('   ✅ VITE_SENTRY_DSN template exists', colors.green);
    } else {
      log('   ⚠️  VITE_SENTRY_DSN not in template', colors.yellow);
      hasWarnings = true;
    }
  }

  log('');

  // Check runtime environment (process.env)
  log('3. Checking runtime environment...', colors.bold);

  if (process.env.SENTRY_DSN) {
    if (validateDSN(process.env.SENTRY_DSN)) {
      log('   ✅ SENTRY_DSN available at runtime', colors.green);
    } else {
      log('   ⚠️  SENTRY_DSN set but invalid', colors.yellow);
      hasWarnings = true;
    }
  } else {
    log('   ℹ️  SENTRY_DSN not in current environment', colors.cyan);
    log('   This is OK for local dev without .env.local', colors.cyan);
  }

  if (process.env.VITE_SENTRY_DSN) {
    if (validateDSN(process.env.VITE_SENTRY_DSN)) {
      log('   ✅ VITE_SENTRY_DSN available at runtime', colors.green);
    } else {
      log('   ⚠️  VITE_SENTRY_DSN set but invalid', colors.yellow);
      hasWarnings = true;
    }
  } else {
    log('   ℹ️  VITE_SENTRY_DSN not in current environment', colors.cyan);
  }

  log('');

  // Summary
  log('='.repeat(60), colors.cyan);
  log('  Summary', colors.bold);
  log('='.repeat(60), colors.cyan);

  if (hasErrors) {
    log('\n❌ Configuration has ERRORS', colors.red + colors.bold);
    log('\nNext steps:', colors.bold);
    log('1. Go to https://sentry.io and create a project', colors.yellow);
    log('2. Copy your Sentry DSN', colors.yellow);
    log('3. Add to .env.local:', colors.yellow);
    log('   SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxxx', colors.cyan);
    log('   VITE_SENTRY_DSN=https://xxxxx@oxxxxx.ingest.sentry.io/xxxxxx', colors.cyan);
    log('\nSee SENTRY_SETUP_GUIDE.md for detailed instructions\n', colors.yellow);
    process.exit(1);
  } else if (hasWarnings) {
    log('\n⚠️  Configuration has WARNINGS', colors.yellow + colors.bold);
    log('\nSentry will work in production but not locally.', colors.yellow);
    log('To enable locally, create .env.local with Sentry DSNs.\n', colors.yellow);
    process.exit(0);
  } else {
    log('\n✅ Sentry configuration looks good!', colors.green + colors.bold);
    log('\nSentry error tracking is properly configured.', colors.green);
    log('Errors will be sent to Sentry in production.\n', colors.green);
    process.exit(0);
  }
}

// Run verification
main();
