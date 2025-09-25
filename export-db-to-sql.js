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

async function exportTablesToSQL() {
  try {
    console.log('Starting database export...');
    
    // Since we can't access information_schema directly, we'll need to try a different approach
    // Let's try to get tables using raw SQL through an RPC function
    let tables = [];
    
    try {
      // Try to get tables using a raw SQL query
      const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
      });
      
      if (!rpcError && rpcResult) {
        tables = rpcResult.map(row => ({ table_name: row.table_name }));
      }
    } catch (rpcErr) {
      console.log('RPC method not available, will try manual table discovery');
    }
    
    // If RPC doesn't work, let's try to discover tables by attempting to query common table names
    if (tables.length === 0) {
      console.log('Attempting to discover tables manually...');
      
      // Common table names to try - you may need to add your specific table names here
      const possibleTableNames = [
        'users', 'profiles', 'posts', 'comments', 'products', 'orders', 'categories',
        'appointments', 'bookings', 'clients', 'services', 'inventory', 'transactions',
        'animals', 'pets', 'veterinary', 'treatments', 'medications', 'visits',
        'customers', 'invoices', 'payments', 'staff', 'employees'
      ];
      
      for (const tableName of possibleTableNames) {
        try {
          const { data, error } = await supabase.from(tableName).select('*').limit(1);
          if (!error) {
            tables.push({ table_name: tableName });
            console.log(`Found table: ${tableName}`);
          }
        } catch (err) {
          // Table doesn't exist, continue
        }
      }
    }

    if (tables.length === 0) {
      console.error('No tables found. Please manually specify table names in the script.');
      console.log('Add your table names to the possibleTableNames array in the script.');
      return;
    }

    console.log(`Found ${tables.length} tables to export:`, tables.map(t => t.table_name));

    let sqlOutput = `-- Supabase Database Export
-- Generated on: ${new Date().toISOString()}
-- Database URL: ${supabaseUrl}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Enable RLS (Row Level Security) for all tables
-- This is important for Supabase

`;

    // First, get the schema for each table
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`Processing table: ${tableName}`);
      
      try {
        // Since we can't access information_schema directly, we'll get a sample row to determine columns
        // This is a simplified approach that won't capture all schema details
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (sampleError) {
          console.error(`Error fetching sample data for ${tableName}:`, sampleError);
          sqlOutput += `-- Error: Could not access table ${tableName}: ${sampleError.message}\n\n`;
          continue;
        }

        // Get column names from the sample data
        let columns = [];
        if (sampleData && sampleData.length > 0) {
          columns = Object.keys(sampleData[0]).map(key => ({
            column_name: key,
            data_type: 'TEXT', // Default to TEXT since we can't determine exact types
            is_nullable: 'YES',
            column_default: null
          }));
        } else {
          // If no data, we'll try to get an empty result set to see column structure
          const { data: emptyData, error: emptyError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000000'); // Unlikely to match
          
          // This might still give us column structure even with no results
          columns = [{ column_name: 'id', data_type: 'TEXT', is_nullable: 'YES', column_default: null }];
        }

        // Create simplified table SQL (without exact schema details)
        sqlOutput += `\n-- Table: ${tableName}\n`;
        sqlOutput += `-- Note: Column types are simplified as we cannot access schema information\n`;
        sqlOutput += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
        sqlOutput += `CREATE TABLE "${tableName}" (\n`;
        
        const columnDefs = columns.map(col => {
          return `    "${col.column_name}" ${col.data_type}`;
        });
        
        sqlOutput += columnDefs.join(',\n');
        sqlOutput += '\n);\n';

        // Get data from the table
        const { data: tableData, error: dataError } = await supabase
          .from(tableName)
          .select('*');

        if (dataError) {
          console.error(`Error fetching data for ${tableName}:`, dataError);
          sqlOutput += `-- Error fetching data for table ${tableName}: ${dataError.message}\n\n`;
          continue;
        }

        if (tableData && tableData.length > 0) {
          sqlOutput += `\n-- Data for table: ${tableName}\n`;
          
          const columnNames = columns.map(col => `"${col.column_name}"`).join(', ');
          
          for (const row of tableData) {
            const values = columns.map(col => {
              const value = row[col.column_name];
              if (value === null) return 'NULL';
              if (typeof value === 'string') {
                // Escape single quotes in strings
                return `'${value.replace(/'/g, "''")}'`;
              }
              if (typeof value === 'object') {
                // Handle JSON objects
                return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              }
              return value;
            }).join(', ');
            
            sqlOutput += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
          }
        } else {
          sqlOutput += `-- No data in table: ${tableName}\n`;
        }

        sqlOutput += '\n';

      } catch (tableError) {
        console.error(`Error processing table ${tableName}:`, tableError);
        sqlOutput += `-- Error processing table ${tableName}: ${tableError.message}\n\n`;
      }
    }

    // Add RLS policies section
    sqlOutput += `
-- Enable Row Level Security on all tables
`;
    
    for (const table of tables) {
      sqlOutput += `ALTER TABLE "${table.table_name}" ENABLE ROW LEVEL SECURITY;\n`;
    }

    sqlOutput += `\n-- End of export\n`;

    // Write to file
    const filename = `supabase_export_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    fs.writeFileSync(filename, sqlOutput);
    
    console.log(`\nExport completed successfully!`);
    console.log(`SQL file saved as: ${filename}`);
    console.log(`Total tables exported: ${tables.length}`);
    
  } catch (error) {
    console.error('Export failed:', error);
  }
}

// Alternative method using raw SQL queries
async function exportWithRawSQL() {
  try {
    console.log('\nAlternative: Using raw SQL to get table schemas...');
    
    // Get table schemas using raw SQL
    const { data: tableSchemas, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `
      });

    if (schemaError) {
      console.log('Raw SQL method not available, using standard method only.');
    } else {
      console.log('Table schema information retrieved via raw SQL');
    }
    
  } catch (error) {
    console.log('Raw SQL method not available:', error.message);
  }
}

// Run the export
console.log('Supabase Database Export Tool');
console.log('============================');
exportTablesToSQL()
  .then(() => {
    console.log('Export process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Export process failed:', error);
    process.exit(1);
  });
