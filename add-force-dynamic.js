// Script to add force-dynamic to all pages that use prisma
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'src/app');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file === 'page.tsx') {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file uses prisma and doesn't have force-dynamic
      if (content.includes('import prisma from "@/lib/prisma"') && 
          !content.includes('export const dynamic = "force-dynamic"')) {
        
        console.log(`✅ Adding force-dynamic to: ${filePath}`);
        
        // Add the export after imports
        const lines = content.split('\n');
        let insertIndex = 0;
        
        // Find the last import statement
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            insertIndex = i + 1;
          }
        }
        
        // Insert the force-dynamic export
        lines.splice(insertIndex, 0, '', '// Force dynamic rendering - don\'t pre-render at build time', 'export const dynamic = "force-dynamic";');
        
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      }
    }
  });
}

walkDir(appDir);
console.log('\n✅ Done!');
