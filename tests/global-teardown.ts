import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up global test environment...');
  
  // Clean up test data if needed
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.dirname(__dirname);
  
  // Generate markdown error report from test results
  await generateErrorReport(fs, path, rootDir);
  
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

async function generateErrorReport(fs: any, path: any, rootDir: string) {
  try {
    const testResultsPath = path.join(rootDir, 'test-results.json');
    
    if (!fs.existsSync(testResultsPath)) {
      console.log('⚠️  No test results file found, skipping error report generation');
      return;
    }
    
    const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf-8'));
    
    if (!testResults.suites || testResults.suites.length === 0) {
      console.log('⚠️  No test suites found in results, skipping error report generation');
      return;
    }
    
    const errors: Array<{
      suiteName: string;
      testTitle: string;
      file: string;
      line?: number;
      error: string;
      stackTrace?: string;
      status: string;
    }> = [];
    
    // Extract errors from test results
    function extractErrors(suites: any[], parentPath = '') {
      for (const suite of suites) {
        const suitePath = parentPath ? `${parentPath} > ${suite.title}` : suite.title;
        
        if (suite.tests) {
          for (const test of suite.tests) {
            if (test.status === 'failed' || test.status === 'timedOut' || test.status === 'interrupted') {
              const result = test.results?.[0];
              if (result) {
                errors.push({
                  suiteName: suitePath,
                  testTitle: test.title,
                  file: suite.file || 'unknown',
                  line: test.location?.line,
                  error: result.error?.message || `Test ${test.status}`,
                  stackTrace: result.error?.stack,
                  status: test.status
                });
              }
            }
          }
        }
        
        if (suite.suites) {
          extractErrors(suite.suites, suitePath);
        }
      }
    }
    
    extractErrors(testResults.suites);
    
    if (errors.length === 0) {
      console.log('✅ No test errors found, skipping error report generation');
      return;
    }
    
    // Generate markdown report
    const timestamp = new Date().toLocaleString();
    let markdown = `# Test Error Report\n\n`;
    markdown += `**Generated:** ${timestamp}  \n`;
    markdown += `**Total Errors:** ${errors.length}  \n`;
    markdown += `**Test Run Status:** ${testResults.status || 'unknown'}  \n\n`;
    
    // Group errors by file
    const errorsByFile = errors.reduce((acc, error) => {
      const fileName = path.basename(error.file);
      if (!acc[fileName]) acc[fileName] = [];
      acc[fileName].push(error);
      return acc;
    }, {} as Record<string, typeof errors>);
    
    markdown += `## Summary\n\n`;
    markdown += `| File | Error Count |\n`;
    markdown += `|------|-------------|\n`;
    Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
      markdown += `| ${file} | ${fileErrors.length} |\n`;
    });
    markdown += `\n`;
    
    // Detailed error reports
    markdown += `## Detailed Error Reports\n\n`;
    
    Object.entries(errorsByFile).forEach(([fileName, fileErrors]) => {
      markdown += `### ${fileName}\n\n`;
      
      fileErrors.forEach((error, index) => {
        markdown += `#### ${index + 1}. ${error.testTitle}\n\n`;
        markdown += `**Suite:** ${error.suiteName}  \n`;
        markdown += `**Status:** ❌ ${error.status.toUpperCase()}  \n`;
        if (error.line) {
          markdown += `**Location:** ${fileName}:${error.line}  \n`;
        }
        markdown += `\n**Error:**\n\`\`\`\n${error.error}\n\`\`\`\n\n`;
        
        if (error.stackTrace) {
          markdown += `**Stack Trace:**\n\`\`\`\n${error.stackTrace}\n\`\`\`\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    });
    
    // Write the markdown file
    const errorReportPath = path.join(rootDir, `test-errors-${Date.now()}.md`);
    fs.writeFileSync(errorReportPath, markdown);
    
    console.log(`📝 Test error report generated: ${path.basename(errorReportPath)}`);
    console.log(`📊 Found ${errors.length} errors across ${Object.keys(errorsByFile).length} test files`);
    
  } catch (error) {
    console.error('❌ Failed to generate error report:', error);
  }
}

export default globalTeardown;