import fs from 'fs-extra';
import path from 'path';
import ignore from 'ignore';

const ALLOWED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', 
  '.py', '.go', '.java', '.c', '.cpp', '.cs',
  '.php', '.rb', '.rs', '.swift',
  '.html', '.css', '.scss', '.json', '.md'
];

const DEFAULT_IGNORES = [
  'node_modules', '.git', 'dist', 'build', '.next',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '*.log', '*.mp4', '*.jpg', '*.jpeg', '*.png', '*.gif', '*.svg', '*.ico',
  '.DS_Store', 'coverage', '.env'
];

export class FileService {
  /**
   * Recursively scans a directory and returns an array of file objects
   * @param {string} dirPath 
   * @returns {Promise<Array<{path: string, content: string, extension: string, size: number, lines: number}>>}
   */
  static async scanDirectory(dirPath) {
    const ig = ignore().add(DEFAULT_IGNORES);

    // Try to read .gitignore if it exists
    try {
      const gitignorePath = path.join(dirPath, '.gitignore');
      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        ig.add(gitignoreContent);
      }
    } catch (e) {
      console.warn("[FILE_SERVICE] Could not read .gitignore:", e.message);
    }

    const files = [];
    const MAX_FILES = 500; // Increased for production-like analysis
    const MAX_FILE_SIZE = 500 * 1024; // 500KB limit per file for analysis

    const walk = async (currentPath, relativePath = '') => {
      if (files.length >= MAX_FILES) return;

      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (files.length >= MAX_FILES) return;

        const entryRelativePath = path.join(relativePath, entry.name);
        const posixPath = entryRelativePath.split(path.sep).join('/');
        
        if (ig.ignores(posixPath)) continue;

        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath, entryRelativePath);
        } else if (entry.isFile()) {
          const extension = path.extname(entry.name).toLowerCase();
          
          // Only process allowed code extensions
          if (!ALLOWED_EXTENSIONS.includes(extension)) continue;

          const stats = await fs.stat(fullPath);
          if (stats.size > MAX_FILE_SIZE) continue;

          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n').length;
          
          files.push({
            path: posixPath,
            content,
            extension,
            size: stats.size,
            lines
          });
        }
      }
    };

    await walk(dirPath);
    return files;
  }

  /**
   * Simple chunking utility for large files
   */
  static chunkContent(content, maxLines = 100) {
    const lines = content.split('\n');
    const chunks = [];
    for (let i = 0; i < lines.length; i += maxLines) {
      chunks.push(lines.slice(i, i + maxLines).join('\n'));
    }
    return chunks;
  }
}
