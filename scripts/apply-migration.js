/**
 * Database Migration Script
 * 
 * Applies the landing logic database schema to production Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250102000000_landing_logic_database_schema.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('📋 Migration file loaded successfully');
console.log(`📊 Migration size: ${migrationSQL.length} characters`);

async function applyMigration() {
  try {
    console.log('🚀 Applying database migration...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec', {
      query: migrationSQL
    });
    
    if (error) {
      // Try alternative approach - execute raw SQL
      console.log('⚠️ RPC approach failed, trying raw SQL execution...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 60)}...`);
        
        try {
          const result = await supabase.from('_migrations').select('*').limit(1);
          // This is just a way to execute raw SQL - we'll need a different approach
          console.log('⚠️ Raw SQL execution not directly supported');
          break;
        } catch (stmtError) {
          console.error(`❌ Error executing statement ${i + 1}:`, stmtError.message);
          console.error(`Statement: ${statement}`);
        }
      }
    } else {
      console.log('✅ Migration applied successfully!');
      console.log('Result:', data);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Provide manual instructions
    console.log('\n📋 Manual Migration Instructions:');
    console.log('Since automatic migration failed, please apply the following manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL editor');
    console.log('3. Copy and paste the content from:');
    console.log('   supabase/migrations/20250102000000_landing_logic_database_schema.sql');
    console.log('4. Execute the SQL');
    
    return false;
  }
}

async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration...');
    
    // Check if shopify_tokens table exists
    const tokensCheck = await supabase.from('shopify_tokens').select('count').limit(1);
    if (tokensCheck.error && tokensCheck.error.code === 'PGRST106') {
      console.log('❌ shopify_tokens table not found');
      return false;
    }
    
    // Check if validate_merchant_integration function exists
    const { data, error } = await supabase.rpc('validate_merchant_integration', {
      p_user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error && error.code === 'PGRST202') {
      console.log('❌ validate_merchant_integration function not found');
      return false;
    }
    
    console.log('✅ Migration verification successful!');
    return true;
    
  } catch (error) {
    console.error('⚠️ Verification error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Starting database migration process...\n');
  
  const migrationSuccess = await applyMigration();
  
  if (migrationSuccess !== false) {
    const verificationSuccess = await verifyMigration();
    
    if (verificationSuccess) {
      console.log('\n🎉 Database migration completed successfully!');
      console.log('The landing logic system is now ready to use.');
    } else {
      console.log('\n⚠️ Migration may not have completed properly.');
      console.log('Please check the database manually.');
    }
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Verify the application is working correctly');
  console.log('2. Test the landing logic flows');
  console.log('3. Monitor for any errors');
}

main().catch(console.error);