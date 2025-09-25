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

// All your table names from the screenshot
const ALL_TABLES = [
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
  'veterinarians'
];

async function improvedCompleteExport() {
  try {
    console.log('🚀 IMPROVED COMPLETE DATABASE EXPORT');
    console.log('====================================');
    console.log(`📋 Processing ${ALL_TABLES.length} tables from your dashboard...`);
    
    let accessibleTables = [];
    let totalRows = 0;
    
    // Phase 1: Test accessibility and get basic info
    console.log('\n📊 Phase 1: Table Analysis');
    console.log('==========================');
    
    for (const tableName of ALL_TABLES) {
      try {
        // First, test if we can access the table at all
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (testError) {
          console.log(`❌ ${tableName} - Access denied: ${testError.message}`);
          continue;
        }
        
        // Get row count
        const { data: allData, error: countError } = await supabase
          .from(tableName)
          .select('*');
        
        if (countError) {
          console.log(`⚠️  ${tableName} - Can access but can't count rows`);
          accessibleTables.push({
            name: tableName,
            data: [],
            rowCount: 0,
            hasData: false,
            accessible: true
          });
        } else {
          const rowCount = allData ? allData.length : 0;
          console.log(`✅ ${tableName} - ${rowCount} rows`);
          
          accessibleTables.push({
            name: tableName,
            data: allData || [],
            rowCount: rowCount,
            hasData: rowCount > 0,
            accessible: true
          });
          
          totalRows += rowCount;
        }
        
      } catch (err) {
        console.log(`❌ ${tableName} - Error: ${err.message}`);
      }
    }
    
    console.log(`\n📈 Found ${accessibleTables.length} accessible tables with ${totalRows} total rows`);
    
    if (accessibleTables.length === 0) {
      console.error('❌ No accessible tables found!');
      return;
    }
    
    // Phase 2: Advanced Column Detection for Empty Tables
    console.log('\n🔍 Phase 2: Advanced Schema Detection');
    console.log('=====================================');
    
    for (const tableInfo of accessibleTables) {
      if (!tableInfo.hasData) {
        // For empty tables, try different methods to get column structure
        console.log(`🔍 Analyzing empty table: ${tableInfo.name}`);
        
        try {
          // Method 1: Try to get columns by selecting specific fields that commonly exist
          const commonFields = ['id', 'created_at', 'updated_at', 'name', 'title', 'description', 'status', 'type', 'user_id'];
          
          for (const field of commonFields) {
            try {
              const { data, error } = await supabase
                .from(tableInfo.name)
                .select(field)
                .limit(1);
              
              if (!error) {
                console.log(`  ✅ Found field: ${field}`);
                // This confirms the table exists and has this field
              }
            } catch (fieldErr) {
              // Field doesn't exist, continue
            }
          }
          
          // Method 2: Try to insert a test record and see what error we get (shows required fields)
          // NOTE: We won't actually insert, just prepare the query to see the error
          
        } catch (schemaErr) {
          console.log(`  ⚠️  Could not detect schema for ${tableInfo.name}`);
        }
      }
    }
    
    // Phase 3: Generate SQL Export
    console.log('\n📤 Phase 3: SQL Generation');
    console.log('==========================');
    
    let sqlOutput = `-- IMPROVED Complete Supabase Database Export
-- Generated on: ${new Date().toISOString()}
-- Database URL: ${supabaseUrl}
-- Total tables: ${accessibleTables.length}
-- Total rows: ${totalRows}
-- Tables: ${accessibleTables.map(t => t.name).join(', ')}

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
-- IMPROVED COMPLETE DATABASE EXPORT
-- =====================================

`;
    
    // Export each table
    for (const tableInfo of accessibleTables) {
      const tableName = tableInfo.name;
      console.log(`\n📋 Processing: ${tableName} (${tableInfo.rowCount} rows)`);
      
      try {
        let columns = [];
        
        if (tableInfo.hasData && tableInfo.data.length > 0) {
          // Table has data - extract column info from first row
          columns = Object.keys(tableInfo.data[0]).map(key => ({
            column_name: key,
            data_type: inferDataType(tableInfo.data[0][key])
          }));
        } else {
          // Empty table - create placeholder structure
          console.log(`  ⚠️  Empty table - creating minimal structure`);
          columns = [
            { column_name: 'id', data_type: 'SERIAL PRIMARY KEY' }
          ];
        }
        
        // Generate table SQL
        sqlOutput += `-- =====================================\n`;
        sqlOutput += `-- TABLE: ${tableName.toUpperCase()}\n`;
        sqlOutput += `-- Rows: ${tableInfo.rowCount}\n`;
        sqlOutput += `-- Columns: ${columns.length}\n`;
        if (!tableInfo.hasData) {
          sqlOutput += `-- NOTE: Empty table - structure is estimated\n`;
        }
        sqlOutput += `-- =====================================\n\n`;
        
        sqlOutput += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
        sqlOutput += `CREATE TABLE "${tableName}" (\n`;
        
        const columnDefs = columns.map(col => {
          if (col.data_type === 'SERIAL PRIMARY KEY') {
            return `    "${col.column_name}" ${col.data_type}`;
          } else {
            return `    "${col.column_name}" ${col.data_type}`;
          }
        });
        
        sqlOutput += columnDefs.join(',\n');
        sqlOutput += '\n);\n\n';
        
        // Add data if exists
        if (tableInfo.hasData) {
          sqlOutput += `-- Data for ${tableName} (${tableInfo.rowCount} rows)\n`;
          
          const columnNames = columns.map(col => `"${col.column_name}"`).join(', ');
          
          for (const row of tableInfo.data) {
            const values = columns.map(col => {
              const value = row[col.column_name];
              return formatSQLValue(value);
            }).join(', ');
            
            sqlOutput += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
          }
        } else {
          sqlOutput += `-- No data in table: ${tableName}\n`;
        }
        
        sqlOutput += '\n';
        
      } catch (tableError) {
        console.error(`❌ Error processing ${tableName}:`, tableError.message);
        sqlOutput += `-- ERROR processing table ${tableName}: ${tableError.message}\n\n`;
      }
    }
    
    // Add final sections
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
    sqlOutput += `-- Tables with data: ${accessibleTables.filter(t => t.hasData).length}\n`;
    sqlOutput += `-- Empty tables: ${accessibleTables.filter(t => !t.hasData).length}\n`;
    sqlOutput += `-- Export completed: ${new Date().toISOString()}\n`;
    sqlOutput += `-- =====================================\n`;
    
    // Write to file
    const filename = `improved_complete_export_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    fs.writeFileSync(filename, sqlOutput);
    
    // Final summary
    console.log(`\n🎉 IMPROVED EXPORT COMPLETE!`);
    console.log(`📄 File: ${filename}`);
    console.log(`📊 Tables: ${accessibleTables.length}`);
    console.log(`📈 Total Rows: ${totalRows}`);
    
    console.log(`\n📋 DETAILED TABLE SUMMARY:`);
    console.log('============================');
    
    accessibleTables.forEach((table, index) => {
      const status = table.hasData ? `${table.rowCount} rows` : 'EMPTY';
      const icon = table.hasData ? '📊' : '📭';
      console.log(`${String(index + 1).padStart(2)}. ${icon} ${table.name.padEnd(25)} - ${status}`);
    });
    
    console.log(`\n⚠️  NOTE: Empty tables (${accessibleTables.filter(t => !t.hasData).length}) were exported with minimal structure.`);
    console.log(`   To get complete schemas for empty tables, you may need direct database access.`);
    
  } catch (error) {
    console.error('❌ Improved export failed:', error);
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
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'TIMESTAMP WITH TIME ZONE';
      }
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

// Run the improved export
improvedCompleteExport()
  .then(() => {
    console.log('\n✅ Improved export process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Improved export process failed:', error);
    process.exit(1);
  });
