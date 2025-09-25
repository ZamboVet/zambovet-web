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

// CONFIGURE YOUR SPECIFIC TABLE NAMES HERE:
const SPECIFIC_TABLES = [
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
  // Add any additional table names here if needed...
];

async function exportSpecificTables() {
  try {
    console.log('Starting specific tables export...');
    console.log(`Looking for tables: ${SPECIFIC_TABLES.join(', ')}`);
    
    let foundTables = [];
    
    // Check which tables actually exist
    for (const tableName of SPECIFIC_TABLES) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (!error) {
          foundTables.push(tableName);
          console.log(`✓ Found table: ${tableName}`);
        } else {
          console.log(`✗ Table not found: ${tableName}`);
        }
      } catch (err) {
        console.log(`✗ Error checking table ${tableName}:`, err.message);
      }
    }

    if (foundTables.length === 0) {
      console.error('No tables found. Please check your table names in SPECIFIC_TABLES array.');
      return;
    }

    console.log(`\nExporting ${foundTables.length} tables...`);

    let sqlOutput = `-- Supabase Database Export (Specific Tables)
-- Generated on: ${new Date().toISOString()}
-- Database URL: ${supabaseUrl}
-- Exported tables: ${foundTables.join(', ')}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

`;

    // Export each table
    for (const tableName of foundTables) {
      console.log(`\nProcessing table: ${tableName}`);
      
      try {
        // Get all data from the table
        const { data: tableData, error: dataError } = await supabase
          .from(tableName)
          .select('*');

        if (dataError) {
          console.error(`Error fetching data for ${tableName}:`, dataError);
          sqlOutput += `-- Error fetching data for table ${tableName}: ${dataError.message}\n\n`;
          continue;
        }

        // Get column information from the first row (if any data exists)
        let columns = [];
        if (tableData && tableData.length > 0) {
          columns = Object.keys(tableData[0]).map(key => ({
            column_name: key,
            // Try to infer basic data types from the values
            data_type: inferDataType(tableData[0][key])
          }));
        }

        // Create table structure
        sqlOutput += `-- Table: ${tableName}\n`;
        sqlOutput += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
        
        if (columns.length > 0) {
          sqlOutput += `CREATE TABLE "${tableName}" (\n`;
          const columnDefs = columns.map(col => `    "${col.column_name}" ${col.data_type}`);
          sqlOutput += columnDefs.join(',\n');
          sqlOutput += '\n);\n\n';
        } else {
          sqlOutput += `-- No data found in table ${tableName}, cannot infer structure\n`;
          sqlOutput += `CREATE TABLE "${tableName}" (id SERIAL PRIMARY KEY);\n\n`;
        }

        // Export data
        if (tableData && tableData.length > 0) {
          sqlOutput += `-- Data for table: ${tableName} (${tableData.length} rows)\n`;
          
          const columnNames = columns.map(col => `"${col.column_name}"`).join(', ');
          
          for (const row of tableData) {
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
        console.log(`✓ Exported ${tableData?.length || 0} rows from ${tableName}`);

      } catch (tableError) {
        console.error(`Error processing table ${tableName}:`, tableError);
        sqlOutput += `-- Error processing table ${tableName}: ${tableError.message}\n\n`;
      }
    }

    // Add RLS policies section
    sqlOutput += `-- Enable Row Level Security on all tables\n`;
    for (const tableName of foundTables) {
      sqlOutput += `ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;\n`;
    }

    sqlOutput += `\n-- End of export\n`;

    // Write to file
    const filename = `supabase_specific_export_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    fs.writeFileSync(filename, sqlOutput);
    
    console.log(`\n🎉 Export completed successfully!`);
    console.log(`📄 SQL file saved as: ${filename}`);
    console.log(`📊 Total tables exported: ${foundTables.length}`);
    
    // Show summary
    console.log(`\n📋 Export Summary:`);
    foundTables.forEach(table => {
      console.log(`  - ${table}`);
    });
    
  } catch (error) {
    console.error('Export failed:', error);
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
    // Handle JSON objects and arrays
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  
  if (typeof value === 'string') {
    // Escape single quotes in strings
    return `'${value.replace(/'/g, "''")}'`;
  }
  
  return `'${value}'`;
}

// Run the export
console.log('🚀 Supabase Specific Tables Export Tool');
console.log('======================================');
exportSpecificTables()
  .then(() => {
    console.log('✅ Export process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Export process failed:', error);
    process.exit(1);
  });
