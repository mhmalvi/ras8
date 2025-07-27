#!/usr/bin/env node

/**
 * Test Runner for Returns Automation SaaS
 * 
 * Comprehensive test suite runner that organizes and executes:
 * - Unit tests
 * - Integration tests  
 * - E2E tests
 * - Performance tests
 */

import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

interface TestSuite {
  name: string;
  pattern: string;
  timeout?: number;
  description: string;
}

const testSuites: TestSuite[] = [
  {
    name: 'Unit Tests',
    pattern: 'src/**/*.test.{ts,tsx}',
    timeout: 30000,
    description: 'Individual component and service tests'
  },
  {
    name: 'Integration Tests', 
    pattern: 'src/test/integration/**/*.test.ts',
    timeout: 60000,
    description: 'Cross-component workflow tests'
  },
  {
    name: 'E2E Tests',
    pattern: 'src/test/e2e/**/*.test.ts', 
    timeout: 120000,
    description: 'End-to-end user journey tests'
  },
  {
    name: 'Performance Tests',
    pattern: 'src/test/performance/**/*.test.ts',
    timeout: 60000,
    description: 'Load and performance validation tests'
  }
];

interface TestResults {
  suite: string;
  passed: number;
  failed: number;
  duration: number;
  coverage?: number;
}

const runTestSuite = async (suite: TestSuite): Promise<TestResults> => {
  console.log(`\n🧪 Running ${suite.name}...`);
  console.log(`📝 ${suite.description}`);
  
  const start = performance.now();
  
  try {
    const command = `npx vitest run "${suite.pattern}" --reporter=json --coverage`;
    const output = execSync(command, { 
      encoding: 'utf8',
      timeout: suite.timeout,
      stdio: 'pipe'
    });
    
    const result = JSON.parse(output);
    const end = performance.now();
    
    return {
      suite: suite.name,
      passed: result.numPassedTests || 0,
      failed: result.numFailedTests || 0,
      duration: Math.round(end - start),
      coverage: result.coverageMap ? calculateCoverage(result.coverageMap) : undefined
    };
    
  } catch (error: any) {
    const end = performance.now();
    console.error(`❌ ${suite.name} failed:`, error.message);
    
    return {
      suite: suite.name,
      passed: 0,
      failed: 1,
      duration: Math.round(end - start)
    };
  }
};

const calculateCoverage = (coverageMap: any): number => {
  // Simplified coverage calculation
  const files = Object.keys(coverageMap);
  if (files.length === 0) return 0;
  
  let totalLines = 0;
  let coveredLines = 0;
  
  files.forEach(file => {
    const fileCoverage = coverageMap[file];
    if (fileCoverage.s) { // Statement coverage
      const statements = Object.values(fileCoverage.s) as number[];
      totalLines += statements.length;
      coveredLines += statements.filter(count => count > 0).length;
    }
  });
  
  return totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0;
};

const generateReport = (results: TestResults[]): void => {
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;
  let avgCoverage = 0;
  let coverageCount = 0;
  
  results.forEach(result => {
    const status = result.failed === 0 ? '✅' : '❌';
    const coverage = result.coverage ? `${result.coverage}%` : 'N/A';
    
    console.log(`${status} ${result.suite}`);
    console.log(`   Passed: ${result.passed} | Failed: ${result.failed}`);
    console.log(`   Duration: ${result.duration}ms | Coverage: ${coverage}`);
    console.log('');
    
    totalPassed += result.passed;
    totalFailed += result.failed;
    totalDuration += result.duration;
    
    if (result.coverage) {
      avgCoverage += result.coverage;
      coverageCount++;
    }
  });
  
  avgCoverage = coverageCount > 0 ? Math.round(avgCoverage / coverageCount) : 0;
  
  console.log('📈 OVERALL METRICS');
  console.log('-'.repeat(30));
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`Passed: ${totalPassed} | Failed: ${totalFailed}`);
  console.log(`Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
  console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`Average Coverage: ${avgCoverage}%`);
  
  // Production readiness assessment
  console.log('\n🎯 PRODUCTION READINESS');
  console.log('-'.repeat(30));
  
  const successRate = totalPassed / (totalPassed + totalFailed);
  const readinessScore = (successRate * 0.7) + (avgCoverage / 100 * 0.3);
  
  if (readinessScore >= 0.8) {
    console.log('✅ READY FOR PRODUCTION');
  } else if (readinessScore >= 0.6) {
    console.log('⚠️  NEEDS IMPROVEMENT BEFORE PRODUCTION');
  } else {
    console.log('❌ NOT READY FOR PRODUCTION');
  }
  
  console.log(`Readiness Score: ${Math.round(readinessScore * 100)}%`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(30));
  
  if (avgCoverage < 80) {
    console.log('• Increase test coverage to 80%+ before production');
  }
  
  if (totalFailed > 0) {
    console.log('• Fix all failing tests before deployment');
  }
  
  if (totalDuration > 60000) {
    console.log('• Optimize test performance (current: too slow)');
  }
  
  console.log('• Review security tests and performance benchmarks');
  console.log('• Ensure all critical user flows are covered');
};

const main = async (): Promise<void> => {
  console.log('🚀 Starting Returns Automation SaaS Test Suite');
  console.log('='.repeat(50));
  
  const results: TestResults[] = [];
  
  for (const suite of testSuites) {
    const result = await runTestSuite(suite);
    results.push(result);
  }
  
  generateReport(results);
  
  // Exit with error code if any tests failed
  const hasFailures = results.some(r => r.failed > 0);
  process.exit(hasFailures ? 1 : 0);
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runTestSuite, generateReport };