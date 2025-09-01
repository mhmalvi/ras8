/**
 * SQL Syntax Validation
 * 
 * Basic validation of the migration SQL file
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function validateSQLSyntax(sqlContent) {
  const issues = [];
  const lines = sqlContent.split('\n');
  
  // Check for common syntax issues
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;
    
    // Check for unmatched dollar quotes
    const doMatches = line.match(/DO \$\$/g);
    const endMatches = line.match(/END \$\$/g);
    
    // Check for function syntax
    if (line.includes('CREATE OR REPLACE FUNCTION')) {
      // Look ahead for AS $$
      let foundAS = false;
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('AS $$')) {
          foundAS = true;
          break;
        }
      }
      if (!foundAS) {
        issues.push(`Line ${lineNumber}: Function missing AS $$ clause`);
      }
    }
    
    // Check for incomplete column types
    if (line.includes('ADD COLUMN') && line.includes('TIME') && !line.includes('TIMESTAMPTZ')) {
      if (line.match(/TIME\s*[;,)]/) || line.endsWith('TIME')) {
        issues.push(`Line ${lineNumber}: Possibly incomplete TIME type (should be TIMESTAMPTZ?)`);
      }
    }
    
    // Check for GET DIAGNOSTICS syntax
    if (line.includes('GET DIAGNOSTICS') && line.includes('FOUND')) {
      issues.push(`Line ${lineNumber}: GET DIAGNOSTICS ... = FOUND is not valid PostgreSQL syntax`);
    }
  }
  
  return issues;
}

function validateStructure(sqlContent) {
  const issues = [];
  
  // Count DO $$ and END $$ pairs
  const doBlocks = (sqlContent.match(/DO \$\$/g) || []).length;
  const endBlocks = (sqlContent.match(/END \$\$/g) || []).length;
  
  if (doBlocks !== endBlocks) {
    issues.push(`Unmatched DO/END blocks: ${doBlocks} DO vs ${endBlocks} END`);
  }
  
  // Count function definitions and endings
  const functionStarts = (sqlContent.match(/CREATE OR REPLACE FUNCTION/g) || []).length;
  const functionEnds = (sqlContent.match(/\$\$;/g) || []).length;
  
  if (functionStarts !== functionEnds) {
    issues.push(`Unmatched functions: ${functionStarts} definitions vs ${functionEnds} endings`);
  }
  
  return issues;
}

function main() {
  console.log('🔍 Validating SQL Migration Syntax...\n');
  
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250102000000_landing_logic_database_schema.sql');
  
  try {
    const sqlContent = readFileSync(migrationPath, 'utf8');
    console.log(`📄 File loaded: ${sqlContent.length} characters, ${sqlContent.split('\n').length} lines`);
    
    // Syntax validation
    const syntaxIssues = validateSQLSyntax(sqlContent);
    const structureIssues = validateStructure(sqlContent);
    
    const allIssues = [...syntaxIssues, ...structureIssues];
    
    if (allIssues.length === 0) {
      console.log('\n✅ SQL Validation: PASSED');
      console.log('✅ No syntax issues detected');
      console.log('✅ Structure appears correct');
      console.log('\n🎯 Migration file is ready to apply');
    } else {
      console.log('\n❌ SQL Validation: ISSUES FOUND');
      console.log('═'.repeat(50));
      
      allIssues.forEach(issue => {
        console.log(`❌ ${issue}`);
      });
      
      console.log('═'.repeat(50));
      console.log('\n⚠️  Please fix these issues before applying the migration');
    }
    
  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    process.exit(1);
  }
}

main();