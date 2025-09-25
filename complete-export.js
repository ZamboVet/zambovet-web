const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Extended list of possible table names based on common patterns
const POSSIBLE_TABLES = [
  // From your screenshot
  'admin_appointments_view',
  'appointments',
  'clinics',
  'emergency_requests',
  'notifications',
  'patients',
  'pet_owner_profiles',
  'profiles',
  'reviews',
  'services',
  'veterinarian_applications',
  'veterinarians',
  
  // Additional common table names for veterinary systems
  'users',
  'pets',
  'animals',
  'owners',
  'bookings',
  'treatments',
  'medications',
  'prescriptions',
  'medical_records',
  'invoices',
  'payments',
  'transactions',
  'staff',
  'employees',
  'departments',
  'specialties',
  'availability',
  'schedules',
  'time_slots',
  'diseases',
  'symptoms',
  'diagnoses',
  'vaccines',
  'lab_results',
  'attachments',
  'documents',
  'images',
  'files',
  'audit_logs',
  'system_logs',
  'user_sessions',
  'roles',
  'permissions',
  'settings',
  'configurations',
  'categories',
  'tags',
  'locations',
  'addresses',
  'contacts',
  'phone_numbers',
  'emails',
  
  // Supabase system tables that might be accessible
  'auth',
  'storage',
  'realtime',
];

async function completeExport() {
  try {
    console.log('🔍 Starting complete database discovery and export...');
    console.log(`🔎 Scanning ${POSSIBLE_TABLES.length} possible table names...`);
    
    let foundTables = [];
    let accessibleTables = [];
    
    // Phase 1: Discovery
    console.log('\n📋 Phase 1: Table Discovery');
    console.log('============================');
    
    for (const tableName of POSSIBLE_TABLES) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (!error) {
          foundTables.push(tableName);
          
          // Check if we can actually access data (some tables might be restricted)
          const { data: testData, error: testError } = await supabase
            .from(tableName)
            .select('*')
            .limit(5);
          
          if (!testError) {
            accessibleTables.push({
              name: tableName,
              rowCount: testData ? testData.length : 0,
              hasData: testData && testData.length > 0
            });
            console.log(`✅ ${tableName} - Accessible (${testData?.length || 0} sample rows)`);
          } else {
            console.log(`⚠️  ${tableName} - Found but restricted access`);
          }
        }
      } catch (err) {
        // Silently continue - table doesn't exist
      }
    }

    console.log(`\n📊 Discovery Results:`);
    console.log(`   Found: ${foundTables.length} tables`);
    console.log(`   Accessible: ${accessibleTables.length} tables`);
    
    if (accessibleTables.length === 0) {
      console.error('❌ No accessible tables found!');
      return;
    }

    // Phase 2: Export
    console.log('\n📤 Phase 2: Data Export');
    console.log('=======================');

    let sqlOutput = `-- Complete Supabase Database Export
-- Generated on: ${new Date().toISOString()}
-- Database URL: ${supabaseUrl}
-- Discovered tables: ${foundTables.length}
-- Exported tables: ${accessibleTables.length}
-- Table list: ${accessibleTables.map(t => t.name).join(', ')}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================
-- COMPLETE DATABASE EXPORT
-- =====================================

`;

    let totalRows = 0;

    // Export each accessible table
    for (const tableInfo of accessibleTables) {
      const tableName = tableInfo.name;
      console.log(`\n🔄 Processing: ${tableName}`);
      
      try {
        // Get all data from the table
        const { data: tableData, error: dataError } = await supabase
          .from(tableName)
          .select('*');

        if (dataError) {
          console.error(`❌ Error fetching ${tableName}:`, dataError.message);
          sqlOutput += `-- ERROR: Could not export table ${tableName}: ${dataError.message}\n\n`;
          continue;
        }

        // Get column information from the first row
        let columns = [];
        if (tableData && tableData.length > 0) {
          columns = Object.keys(tableData[0]).map(key => ({
            column_name: key,
            data_type: inferDataType(tableData[0][key])
          }));
        }

        // Create table structure
        sqlOutput += `-- =====================================\n`;
        sqlOutput += `-- TABLE: ${tableName.toUpperCase()}\n`;
        sqlOutput += `-- Rows: ${tableData?.length || 0}\n`;
        sqlOutput += `-- Columns: ${columns.length}\n`;
        sqlOutput += `-- =====================================\n\n`;
        
        sqlOutput += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
        
        if (columns.length > 0) {
          sqlOutput += `CREATE TABLE "${tableName}" (\n`;
          const columnDefs = columns.map(col => `    "${col.column_name}" ${col.data_type}`);
          sqlOutput += columnDefs.join(',\n');
          sqlOutput += '\n);\n\n';

          // Add comments about the columns
          sqlOutput += `-- Columns in ${tableName}: ${columns.map(c => c.column_name).join(', ')}\n\n`;
        } else {
          sqlOutput += `-- No data found in ${tableName}, creating minimal structure\n`;
          sqlOutput += `CREATE TABLE "${tableName}" (id SERIAL PRIMARY KEY);\n\n`;
        }

        // Export data
        if (tableData && tableData.length > 0) {
          sqlOutput += `-- Data for ${tableName} (${tableData.length} rows)\n`;
          
          const columnNames = columns.map(col => `"${col.column_name}"`).join(', ');
          
          for (const row of tableData) {
            const values = columns.map(col => {
              const value = row[col.column_name];
              return formatSQLValue(value);
            }).join(', ');
            
            sqlOutput += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
          }
          
          totalRows += tableData.length;
          console.log(`✅ Exported ${tableData.length} rows from ${tableName}`);
        } else {
          sqlOutput += `-- No data in table: ${tableName}\n`;
          console.log(`⚪ No data in ${tableName}`);
        }

        sqlOutput += '\n';

      } catch (tableError) {
        console.error(`❌ Error processing ${tableName}:`, tableError.message);
        sqlOutput += `-- ERROR processing table ${tableName}: ${tableError.message}\n\n`;
      }
    }

    // Add RLS and final sections
    sqlOutput += `-- =====================================\n`;
    sqlOutput += `-- ENABLE ROW LEVEL SECURITY\n`;
    sqlOutput += `-- =====================================\n\n`;
    
    for (const tableInfo of accessibleTables) {
      sqlOutput += `ALTER TABLE "${tableInfo.name}" ENABLE ROW LEVEL SECURITY;\n`;
    }

    sqlOutput += `\n-- =====================================\n`;
    sqlOutput += `-- EXPORT SUMMARY\n`;
    sqlOutput += `-- =====================================\n`;
    sqlOutput += `-- Total tables exported: ${accessibleTables.length}\n`;
    sqlOutput += `-- Total rows exported: ${totalRows}\n`;
    sqlOutput += `-- Export completed: ${new Date().toISOString()}\n`;
    sqlOutput += `-- =====================================\n`;

    // Write to file
    const filename = `complete_supabase_export_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    fs.writeFileSync(filename, sqlOutput);
    
    console.log(`\n🎉 COMPLETE EXPORT FINISHED!`);
    console.log(`📄 File: ${filename}`);
    console.log(`📊 Tables: ${accessibleTables.length}`);
    console.log(`📈 Total Rows: ${totalRows}`);
    
    // Detailed summary
    console.log(`\n📋 DETAILED SUMMARY:`);
    console.log('=====================');
    accessibleTables.forEach(table => {
      console.log(`  📁 ${table.name} - ${table.hasData ? 'HAS DATA' : 'EMPTY'}`);
    });
    
  } catch (error) {
    console.error('❌ Complete export failed:', error);
  }
}

function inferDataType(value) {
  if (value === null || value === undefined) return 'TEXT';
  
  const type = typeof value;
  
  switch (type) {
    case 'boolean':
      return 'BOOLEAN';
    case 'number':
      return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
    case 'object':
      if (value instanceof Date) return 'TIMESTAMP WITH TIME ZONE';
      if (Array.isArray(value)) return 'JSONB';
      return 'JSONB';
    case 'string':
      // Check if it's a timestamp
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'TIMESTAMP WITH TIME ZONE';
      }
      // Check if it's a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return 'UUID';
      }
      return 'TEXT';
    default:
      return 'TEXT';
  }
}

function formatSQLValue(value) {
  if (value === null || value === undefined) return 'NULL';
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  
  return `'${value}'`;
}

// Run the complete export
console.log('🚀 COMPLETE SUPABASE DATABASE EXPORT');
console.log('====================================');
completeExport()
  .then(() => {
    console.log('✅ Complete export process finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Complete export process failed:', error);
    process.exit(1);
  });
