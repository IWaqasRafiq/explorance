import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('./src/components').concat(getAllFiles('./src/hooks'));

files.forEach(file => {
  if (file.endsWith('.jsx') || file.endsWith('.js')) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('"use client";') && !content.includes("'use client';")) {
      fs.writeFileSync(file, '"use client";\n\n' + content);
      console.log(`Added "use client" to ${file}`);
    }
  }
});
