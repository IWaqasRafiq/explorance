import fs from 'fs';
import path from 'path';
import babel from '@babel/core';

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

const files = getAllFiles('./src');

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const isTsx = file.endsWith('.tsx');
    const newExt = isTsx ? '.jsx' : '.js';
    const newFile = file.replace(/\.tsx?$/, newExt);
    
    try {
      const result = babel.transformFileSync(file, {
        presets: [
          ["@babel/preset-typescript", { isTSX: isTsx, allExtensions: true }]
        ],
        plugins: [
          "@babel/plugin-syntax-jsx"
        ],
        retainLines: true,
      });

      let code = result.code;
      
      // Next.js routing replacements
      code = code.replace(/import\s+\{.*Link.*\}\s+from\s+["']react-router-dom["'];?/g, "import Link from 'next/link';");
      code = code.replace(/import\s+\{.*useNavigate.*\}\s+from\s+["']react-router-dom["'];?/g, "import { useRouter } from 'next/navigation';");
      code = code.replace(/const\s+navigate\s*=\s*useNavigate\(\)/g, "const router = useRouter()");
      code = code.replace(/navigate\(/g, "router.push(");
      // specific link to replace
      code = code.replace(/<Link\s+to=/g, "<Link href=");

      fs.writeFileSync(newFile, code);
      fs.unlinkSync(file);
      console.log(`Converted ${file} to ${newFile}`);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
});
