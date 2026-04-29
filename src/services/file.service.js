import fs from 'fs-extra';
import path from 'path';
import ignore from 'ignore';

const DEFAULT_IGNORES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lock',
  'bun.lockb',
  '*.log',
  '*.mp4',
  '*.jpg',
  '*.jpeg',
  '*.png',
  '*.gif',
  '*.svg',
  '*.ico',
];

export class FileService {
  /**
   * Recursively scans a directory and returns an array of file objects
   * @param {string} dirPath 
   * @returns {Promise<Array<{path: string, content: string, extension: string, size: number}>>}
   */
  static async scanDirectory(dirPath) {
    const ig = ignore().add(DEFAULT_IGNORES);

    // Try to read .gitignore if it exists
    try {
      const gitignoreContent = await fs.readFile(path.join(dirPath, '.gitignore'), 'utf8');
      ig.add(gitignoreContent);
    } catch (e) {
      // no .gitignore found or unreadable, ignore
    }

    const files = [];
    const MAX_FILES = 100;

    const walk = async (currentPath, relativePath = '') => {
      if (files.length >= MAX_FILES) return;

      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (files.length >= MAX_FILES) return;

        const entryRelativePath = path.join(relativePath, entry.name);
        const posixPath = entryRelativePath.split(path.sep).join('/');
        
        if (ig.ignores(posixPath)) {
          continue;
        }

        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath, entryRelativePath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          
          // Skip files larger than 1MB to limit MVP size
          if (stats.size > 1024 * 1024) {
            continue;
          }

          const content = await fs.readFile(fullPath, 'utf8');
          const extension = path.extname(entry.name);
          
          files.push({
            path: posixPath,
            content,
            extension,
            size: stats.size,
          });
        }
      }
    };

    await walk(dirPath);
    return files;
  }

  /**
   * Chunks large files into smaller parts
   * @param {string} content 
   * @param {number} linesPerChunk 
   * @returns {string[]}
   */
  static chunkContent(content, linesPerChunk = 1000) {
    const lines = content.split('\n');
    const chunks = [];
    
    for (let i = 0; i < lines.length; i += linesPerChunk) {
      chunks.push(lines.slice(i, i + linesPerChunk).join('\n'));
    }
    
    return chunks;
  }
}
