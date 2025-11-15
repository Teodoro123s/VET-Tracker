const fs = require('fs');
const path = require('path');

function fixRemaining(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Remove all TypeScript syntax
  // 1. Generic types like <'input' | 'success'>
  if (/<[^>]*>/g.test(content)) {
    content = content.replace(/<[^>]*>/g, '');
    modified = true;
  }

  // 2. Parameter types - Remove everything after : in parameter lists
  if (/(\w+):\s*\w+\w*(?:Props|Context|Type|Interface)/g.test(content)) {
    content = content.replace(/(\w+):\s*\w+\w*(?:Props|Context|Type|Interface)/g, '$1');
    modified = true;
  }

  // 3. Other type annotations
  if (/:\s*(string|number|boolean|any|void|never|unknown|object|React\.\w+)/g.test(content)) {
    content = content.replace(/:\s*(string|number|boolean|any|void|never|unknown|object|React\.\w+)/g, '');
    modified = true;
  }

  // 4. Function return types like ): Promise<...> => or ): Type =>
  if (/\):\s*\w+(?:<[^>]*>)?\s*=>/g.test(content)) {
    content = content.replace(/\):\s*\w+(?:<[^>]*>)?\s*=>/g, ') =>');
    modified = true;
  }

  // 5. Arrow function type params
  if (/\{\s*(\w+):\s*\w+(?:<[^>]*>)?\s*[;}]/g.test(content)) {
    content = content.replace(/:\s*\w+(?:<[^>]*>)?(?=[;}])/g, '');
    modified = true;
  }

  // 6. Import type annotations
  if (/import\s*{\s*type\s+/g.test(content)) {
    content = content.replace(/import\s*{\s*type\s+/g, 'import { ');
    modified = true;
  }

  // 7. Clean up any remaining orphaned type definitions (lines with just types)
  content = content.replace(/^\s*\w+\?:\s*[^,};\n]*[,;]?\s*$/gm, '');

  if (modified) {
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
      if (fixRemaining(filePath)) {
        console.log(`Fixed: ${filePath}`);
        count++;
      }
    }
  }
  return count;
}

const count = processDirectory(__dirname);
console.log(`\nTotal files fixed: ${count}`);
