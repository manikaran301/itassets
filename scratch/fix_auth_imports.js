const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

const srcDir = path.join(process.cwd(), 'src');

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const pattern = /from\s+['"].*auth\/\[\.\.\.nextauth\]\/route['"]/g;
    
    if (pattern.test(content)) {
      console.log(`Updating: ${filePath}`);
      const newContent = content.replace(pattern, 'from "@/lib/auth"');
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  }
});
