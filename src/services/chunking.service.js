import path from 'path';

export class ChunkingService {
  /**
   * Chunks a list of files into smaller pieces with metadata
   * @param {Array<{path: string, content: string, extension: string}>} files 
   * @param {Object} options 
   * @returns {Array<{content: string, metadata: Object}>}
   */
  static processFiles(files, options = { chunkSize: 1500, chunkOverlap: 200 }) {
    const allChunks = [];

    for (const file of files) {
      const chunks = this.createChunks(file.content, options.chunkSize, options.chunkOverlap);
      
      chunks.forEach((chunk, index) => {
        allChunks.push({
          content: `File: ${file.path}\n---\n${chunk}`,
          metadata: {
            source: file.path,
            extension: file.extension,
            chunkIndex: index,
            totalChunks: chunks.length,
            language: this.getLanguageFromExtension(file.extension)
          }
        });
      });
    }

    return allChunks;
  }

  /**
   * Splits a string into overlapping chunks
   */
  static createChunks(text, size, overlap) {
    if (text.length <= size) return [text];

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + size;
      
      // If we are not at the end of the text, try to find a better split point
      if (end < text.length) {
        // Try to find the last double newline (function boundary) in the window
        const doubleNewline = text.lastIndexOf('\n\n', end);
        if (doubleNewline > start + (size * 0.5)) {
          end = doubleNewline + 2;
        } else {
          // Fallback: try to find the last single newline
          const singleNewline = text.lastIndexOf('\n', end);
          if (singleNewline > start + (size * 0.5)) {
            end = singleNewline + 1;
          }
        }
      }

      chunks.push(text.substring(start, end).trim());
      
      // Move start forward, accounting for overlap
      start = end - overlap;
      
      // Safety: ensure we are actually moving forward
      if (start <= 0 && chunks.length > 0) break; 
      if (start >= text.length) break;
      
      // If the remaining text is too small, just take the rest and finish
      if (text.length - start < size * 0.2) {
        chunks.push(text.substring(start).trim());
        break;
      }
    }

    return chunks;
  }

  static getLanguageFromExtension(ext) {
    const mapping = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.java': 'java',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.md': 'markdown'
    };
    return mapping[ext] || 'text';
  }
}
