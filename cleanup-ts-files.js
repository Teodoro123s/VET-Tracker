const fs = require('fs');
const path = require('path');

const filesToDelete = [
  'constants/Typography.ts',
  'constants/MaroonTheme.ts',
  'constants/Colors.ts',
  'expo-env.d.ts'
];

filesToDelete.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`Deleted: ${file}`);
  }
});

console.log('Cleanup complete!');
