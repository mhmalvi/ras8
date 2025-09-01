#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Validating Environment Configuration...\n');

// Check if .env.local exists
const envPath = join(rootDir, '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('   Please create .env.local and copy values from Vercel dashboard');
  process.exit(1);
}

// Read and parse .env.local
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Required environment variables
const requiredVars = [
  'VITE_SHOPIFY_CLIENT_ID',
  'SHOPIFY_CLIENT_SECRET',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET_KEY',
  'VITE_APP_URL'
];

// Optional but recommended
const optionalVars = [
  'VITE_DEV_MODE',
  'SUPABASE_ACCESS_TOKEN',
  'NODE_ENV'
];

console.log('📋 Required Environment Variables:');
console.log('─'.repeat(50));

let missingRequired = [];
requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (value && value !== `your_${varName.toLowerCase()}_here` && value !== '') {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing or placeholder`);
    missingRequired.push(varName);
  }
});

console.log('\n📋 Optional Environment Variables:');
console.log('─'.repeat(50));

optionalVars.forEach(varName => {
  const value = envVars[varName];
  if (value && value !== `your_${varName.toLowerCase()}_here` && value !== '') {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`⚠️  ${varName}: Not set (optional)`);
  }
});

// Check Vercel configuration
console.log('\n📦 Vercel Configuration:');
console.log('─'.repeat(50));

const vercelConfigPath = join(rootDir, '.vercel', 'project.json');
if (existsSync(vercelConfigPath)) {
  const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));
  console.log(`✅ Project ID: ${vercelConfig.projectId}`);
  console.log(`✅ Organization: ${vercelConfig.orgId}`);
} else {
  console.log('⚠️  Vercel project not linked locally');
}

// Summary
console.log('\n📊 Summary:');
console.log('─'.repeat(50));

if (missingRequired.length === 0) {
  console.log('✅ All required environment variables are configured!');
  console.log('   Your project is ready for local development and deployment.');
  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm run dev (for local development)');
  console.log('   2. Run: npm run build (to test production build)');
  console.log('   3. Deploy: git push or npx vercel --prod');
} else {
  console.log(`❌ Missing ${missingRequired.length} required environment variable(s)`);
  console.log('\n📝 To fix this:');
  console.log('   1. Go to: https://vercel.com/info-quadquetechs-projects/ras8/settings/environment-variables');
  console.log('   2. Click on each variable to reveal its value');
  console.log('   3. Copy the values to your .env.local file');
  console.log(`   4. Replace placeholders for: ${missingRequired.join(', ')}`);
}

console.log('\n');