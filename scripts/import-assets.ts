import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const CSV_FILE = path.join(process.cwd(), 'public/Zero_Client_Ready_Import.csv');

async function importAssets() {
  try {
    console.log('🚀 Starting Zero Client Assets Bulk Import\n');
    console.log(`📁 CSV File: ${CSV_FILE}`);
    
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }

    const fileStream = fs.createReadStream(CSV_FILE);
    const formData = new FormData();
    
    // Convert Node stream to File-like object
    const buffer = fs.readFileSync(CSV_FILE);
    const blob = new Blob([buffer], { type: 'text/csv' });
    formData.append('file', blob, 'Zero_Client_Ready_Import.csv');

    console.log(`\n📤 Uploading to ${API_URL}/api/assets/import...\n`);

    const response = await fetch(`${API_URL}/api/assets/import`, {
      method: 'POST',
      body: formData,
      // Note: In a real scenario, you'd need to include authentication headers
      // This requires proper session handling
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const result = await response.json();

    console.log('✅ Import Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total Records: ${result.summary.total}`);
    console.log(`   Imported: ${result.summary.imported}`);
    console.log(`   Skipped: ${result.summary.skipped}`);
    console.log(`   Errors: ${result.summary.errors}`);

    if (result.results.length > 0) {
      console.log('\n📋 Results:');
      const imported = result.results.filter((r: any) => r.status === 'imported');
      const errors = result.results.filter((r: any) => r.status === 'error');
      
      if (imported.length > 0) {
        console.log('\n✅ Successfully Imported:');
        imported.slice(0, 5).forEach((r: any) => {
          console.log(`   • ${r.assetTag} (${r.type}) → ${r.assignedTo}`);
        });
        if (imported.length > 5) {
          console.log(`   ... and ${imported.length - 5} more`);
        }
      }

      if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach((r: any) => {
          console.log(`   • ${r.assetTag}: ${r.reason}`);
        });
      }
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Import Failed:', error.message);
    process.exit(1);
  }
}

importAssets();
