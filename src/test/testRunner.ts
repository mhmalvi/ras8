#!/usr/bin/env node

/**
 * Test Runner for Returns Automation SaaS
 * 
 * This script runs comprehensive tests for all services and user flows
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestSuite {
  name: string;
  path: string;
  description: string;
}

const testSuites: TestSuite[] = [
  {
    name: 'Unit Tests - AI Service',
    path: 'src/services/__tests__/aiService.test.ts',
    description: 'Tests AI recommendation engine and fallback logic'
  },
  {
    name: 'Unit Tests - Return Service', 
    path: 'src/services/__tests__/returnService.test.ts',
    description: 'Tests return CRUD operations and validation'
  },
  {
    name: 'Unit Tests - Shopify Service',
    path: 'src/services/__tests__/shopifyService.test.ts', 
    description: 'Tests Shopify API integration and webhook validation'
  },
  {
    name: 'Unit Tests - Order Service',
    path: 'src/services/__tests__/orderService.test.ts',
    description: 'Tests order lookup and validation logic'
  },
  {
    name: 'Integration Tests - User Flows',
    path: 'src/test/integration/userFlows.test.ts',
    description: 'Tests complete user journeys and error scenarios'
  }
];

const runTests = async () => {
  console.log('🧪 Returns Automation SaaS - Test Suite Runner\n');
  console.log('Running comprehensive tests for all services...\n');

  let passedSuites = 0;
  let totalSuites = testSuites.length;

  for (const suite of testSuites) {
    console.log(`📋 ${suite.name}`);
    console.log(`   ${suite.description}`);
    
    try {
      await runTestSuite(suite.path);
      console.log(`   ✅ PASSED\n`);
      passedSuites++;
    } catch (error) {
      console.log(`   ❌ FAILED\n`);
      console.error(error);
    }
  }

  console.log(`\n📊 Test Results: ${passedSuites}/${totalSuites} suites passed`);
  
  if (passedSuites === totalSuites) {
    console.log('🎉 All tests passed! Ready for deployment.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues.');
    process.exit(1);
  }
};

const runTestSuite = (testPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const vitest = spawn('npx', ['vitest', 'run', testPath], {
      stdio: 'pipe',
      cwd: path.resolve(__dirname, '../..')
    });

    let output = '';
    let errorOutput = '';

    vitest.stdout.on('data', (data) => {
      output += data.toString();
    });

    vitest.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    vitest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed with code ${code}\n${errorOutput}`));
      }
    });
  });
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testSuites };