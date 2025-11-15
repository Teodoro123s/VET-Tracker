const fs = require('fs');
const path = require('path');

function fixTypescript(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const original = content;

  // 1. Remove type annotations from interface properties (just type, no value)
  // Match lines like "  name: string;" but preserve object properties
  content = content.replace(/^(\s+)(\w+)\?\s*:\s*([\w|<>[\]&\s]+)[\s;]*$/gm, '');
  
  // 2. Remove function return types - ): Type => becomes ):
  content = content.replace(/\)\s*:\s*([\w<>[\]|&\s]+)\s*=>/g, ') =>');
  
  // 3. Remove parameter type annotations - Keep parameter names but remove type info
  content = content.replace(/(\w+)\s*:\s*([\w<>[\]|&\s]+?)(?=[\s,}])/g, '$1');
  
  // 4. Remove generic type parameters in angle brackets when they're alone
  content = content.replace(/<[\w|&\s']*>/g, '');
  
  // 5. Remove "import type" making it just "import"  
  content = content.replace(/import\s+{\s*type\s+/g, 'import { ');
  
  // 6. Remove orphaned interface/type keyword lines
  content = content.replace(/^[\s]*(interface|type)\s+\w+.*?[{};]*$/gm, '');

  // Clean up excess whitespace
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo' && file !== 'android' && file !== 'ios') {
        count += processDirectory(filePath);
      }
    } else if (file.endsWith('.js') && !file.startsWith('fix-')) {
      try {
        if (fixTypescript(filePath)) {
          console.log(`✓ ${filePath}`);
          count++;
        }
      } catch (e) {
        console.error(`✗ ${filePath}: ${e.message}`);
      }
    }
  }
  return count;
}

const count = processDirectory(__dirname);
console.log(`\n✓ Fixed ${count} files`);
