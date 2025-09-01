#!/usr/bin/env ts-node

/**
 * Comprehensive Test Runner for H5 Returns Automation SaaS
 * Runs all Playwright e2e tests with proper environment setup
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestSuite {
  name: string;
  file: string;
  description: string;
  critical: boolean;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'core-functionality',
    file: 'tests/e2e/core-functionality.spec.ts',
    description: 'Essential application functionality and health tests',
    critical: true
  },
  {
    name: 'database-operations',
    file: 'tests/e2e/database-operations.spec.ts',
    description: 'Database integration and Supabase function tests',
    critical: true
  },
  {
    name: 'oauth-flow',
    file: 'tests/e2e/oauth-flow.spec.ts',
    description: 'Shopify OAuth authentication flow tests',
    critical: true
  },
  {
    name: 'returns-workflow',
    file: 'tests/e2e/returns-workflow.spec.ts',
    description: 'Returns management and workflow tests',
    critical: true
  },
  {
    name: 'security-validation',
    file: 'tests/e2e/security-validation.spec.ts',
    description: 'Security vulnerability and validation tests',
    critical: true
  },
  {
    name: 'api-authentication',
    file: 'tests/e2e/api-authentication.spec.ts',
    description: 'API authentication and session management tests',
    critical: false
  },
  {
    name: 'performance-accessibility',
    file: 'tests/e2e/performance-accessibility.spec.ts',
    description: 'Performance optimization and accessibility tests',
    critical: false
  },
  {
    name: 'shopify-auth-flow',
    file: 'tests/e2e/shopify-auth-flow.spec.ts',
    description: 'Legacy Shopify authentication tests',
    critical: false
  }
];

class TestRunner {
  private results: Map<string, { success: boolean; duration: number; error?: string }> = new Map();

  async run(options: {
    suite?: string;
    criticalOnly?: boolean;
    browser?: string;
    parallel?: boolean;
    reporter?: string;
    headed?: boolean;
  } = {}) {
    console.log('🚀 Starting H5 Returns Automation E2E Test Suite');
    console.log('================================================\n');

    // Environment validation
    await this.validateEnvironment();

    // Determine which tests to run
    const suitesToRun = this.selectTestSuites(options);

    console.log(`📋 Running ${suitesToRun.length} test suites:\n`);
    suitesToRun.forEach(suite => {
      console.log(`  • ${suite.name}: ${suite.description}`);
    });
    console.log('');

    // Run tests
    const startTime = Date.now();
    
    if (options.parallel && suitesToRun.length > 1) {
      await this.runInParallel(suitesToRun, options);
    } else {
      await this.runSequentially(suitesToRun, options);
    }

    const totalDuration = Date.now() - startTime;

    // Generate report
    this.generateReport(totalDuration);
  }

  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating test environment...\n');

    // Check if app is running
    try {
      const response = await fetch(process.env.VITE_APP_URL || 'http://localhost:8082');
      if (!response.ok) {
        throw new Error(`App returned ${response.status}`);
      }
      console.log('  ✅ App server is running');
    } catch (error) {
      console.error('  ❌ App server is not running');
      console.error('     Please start the app with: npm run dev\n');
      process.exit(1);
    }

    // Check required environment variables
    const requiredEnvVars = [
      'VITE_SHOPIFY_CLIENT_ID',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('  ⚠️  Missing environment variables:', missingVars.join(', '));
      console.warn('     Some tests may be skipped or use mock data');
    } else {
      console.log('  ✅ Environment variables are configured');
    }

    // Check Playwright browsers
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      console.log('  ✅ Playwright is installed');
    } catch (error) {
      console.error('  ❌ Playwright is not installed');
      console.error('     Please run: npx playwright install\n');
      process.exit(1);
    }

    console.log('');
  }

  private selectTestSuites(options: any): TestSuite[] {
    let suites = TEST_SUITES;

    if (options.suite) {
      suites = suites.filter(suite => suite.name === options.suite);
      if (suites.length === 0) {
        console.error(`❌ Test suite '${options.suite}' not found`);
        console.log('\nAvailable suites:');
        TEST_SUITES.forEach(suite => console.log(`  • ${suite.name}`));
        process.exit(1);
      }
    }

    if (options.criticalOnly) {
      suites = suites.filter(suite => suite.critical);
    }

    // Filter out missing test files
    suites = suites.filter(suite => {
      if (!existsSync(suite.file)) {
        console.warn(`⚠️  Test file not found: ${suite.file}`);
        return false;
      }
      return true;
    });

    return suites;
  }

  private async runSequentially(suites: TestSuite[], options: any): Promise<void> {
    for (const suite of suites) {
      await this.runSuite(suite, options);
    }
  }

  private async runInParallel(suites: TestSuite[], options: any): Promise<void> {
    console.log('🔄 Running tests in parallel...\n');
    
    const promises = suites.map(suite => this.runSuite(suite, options));
    await Promise.all(promises);
  }

  private async runSuite(suite: TestSuite, options: any): Promise<void> {
    console.log(`🧪 Running ${suite.name}...`);
    
    const startTime = Date.now();
    let playwrightArgs = [
      'test',
      suite.file,
      '--reporter=list'
    ];

    if (options.browser) {
      playwrightArgs.push('--project', options.browser);
    }

    if (options.headed) {
      playwrightArgs.push('--headed');
    }

    if (options.reporter && options.reporter !== 'list') {
      playwrightArgs = playwrightArgs.filter(arg => arg !== '--reporter=list');
      playwrightArgs.push('--reporter', options.reporter);
    }

    try {
      const output = execSync(`npx playwright ${playwrightArgs.join(' ')}`, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 300000 // 5 minutes timeout
      });

      const duration = Date.now() - startTime;
      this.results.set(suite.name, { success: true, duration });
      
      console.log(`  ✅ ${suite.name} passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorOutput = error.stdout || error.stderr || error.message;
      
      this.results.set(suite.name, { 
        success: false, 
        duration,
        error: errorOutput.toString()
      });
      
      console.log(`  ❌ ${suite.name} failed (${duration}ms)`);
      if (process.env.VERBOSE) {
        console.log(`     Error: ${errorOutput}`);
      }
    }
  }

  private generateReport(totalDuration: number): void {
    console.log('\n📊 Test Results Summary');
    console.log('========================\n');

    const passedTests = Array.from(this.results.entries()).filter(([_, result]) => result.success);
    const failedTests = Array.from(this.results.entries()).filter(([_, result]) => !result.success);
    const criticalFailures = failedTests.filter(([name]) => 
      TEST_SUITES.find(suite => suite.name === name)?.critical
    );

    console.log(`Total Tests: ${this.results.size}`);
    console.log(`Passed: ${passedTests.length}`);
    console.log(`Failed: ${failedTests.length}`);
    console.log(`Critical Failures: ${criticalFailures.length}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('');

    if (passedTests.length > 0) {
      console.log('✅ Passed Tests:');
      passedTests.forEach(([name, result]) => {
        const suite = TEST_SUITES.find(s => s.name === name);
        console.log(`   • ${name}: ${suite?.description} (${result.duration}ms)`);
      });
      console.log('');
    }

    if (failedTests.length > 0) {
      console.log('❌ Failed Tests:');
      failedTests.forEach(([name, result]) => {
        const suite = TEST_SUITES.find(s => s.name === name);
        const criticalBadge = suite?.critical ? ' [CRITICAL]' : '';
        console.log(`   • ${name}: ${suite?.description}${criticalBadge} (${result.duration}ms)`);
      });
      console.log('');
    }

    // Exit code based on results
    if (criticalFailures.length > 0) {
      console.log('🚨 Critical test failures detected. Build should not proceed to production.');
      process.exit(1);
    } else if (failedTests.length > 0) {
      console.log('⚠️  Some non-critical tests failed. Review before production deployment.');
      process.exit(1);
    } else {
      console.log('🎉 All tests passed! Ready for deployment.');
      process.exit(0);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: any = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--suite':
        options.suite = args[++i];
        break;
      case '--critical-only':
        options.criticalOnly = true;
        break;
      case '--browser':
        options.browser = args[++i];
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--reporter':
        options.reporter = args[++i];
        break;
      case '--headed':
        options.headed = true;
        break;
      case '--help':
        console.log(`
H5 Returns Automation E2E Test Runner

Usage: npm run test:e2e [options]

Options:
  --suite <name>        Run specific test suite
  --critical-only       Run only critical tests
  --browser <name>      Run on specific browser (chromium, firefox, webkit)
  --parallel           Run test suites in parallel
  --reporter <name>     Use specific reporter (html, json, junit)
  --headed             Run tests in headed mode
  --help               Show this help message

Examples:
  npm run test:e2e                           # Run all tests
  npm run test:e2e -- --critical-only       # Run only critical tests
  npm run test:e2e -- --suite oauth-flow    # Run specific suite
  npm run test:e2e -- --parallel --reporter html  # Parallel with HTML report
        `);
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  const runner = new TestRunner();
  await runner.run(options);
}

// Check if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };