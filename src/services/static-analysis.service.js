import path from 'path';

export class StaticAnalysisService {
  /**
   * Main entry point for static analysis
   */
  static analyze(files) {
    console.log(`[STATIC_ANALYSIS] Analyzing ${files.length} files...`);
    
    const duplicates = this.findDuplicates(files);
    const unusedCode = this.findUnusedExports(files);
    const metrics = this.calculateMetrics(files, duplicates, unusedCode);
    const staticBugs = this.detectBugs(files);
    const staticPerf = this.detectPerformance(files);

    return {
      purpose: this.extractPurpose(files),
      duplicates,
      unusedCode,
      metrics,
      bugs: staticBugs,
      performance: staticPerf,
      folderStructure: this.generateFolderStructure(files),
      libraries: this.detectLibraries(files),
      credentials: this.detectCredentials(files)
    };
  }

  /**
   * Extracts project purpose from README.md or comments
   */
  static extractPurpose(files) {
    const readme = files.find(f => f.path.toLowerCase().endsWith('readme.md'));
    if (readme) {
      // Get the first few lines after the title
      const lines = readme.content.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#'));
      
      if (lines.length > 0) {
        return lines.slice(0, 3).join(' ');
      }
    }
    
    // Fallback: look for a description in package.json
    const pkg = files.find(f => f.path.endsWith('package.json'));
    if (pkg) {
      try {
        const data = JSON.parse(pkg.content);
        if (data.description) return data.description;
      } catch (e) {}
    }

    return "No project description found in README or package.json.";
  }

  /**
   * Static bug detection using common anti-patterns
   */
  static detectBugs(files) {
    const bugs = [];
    const patterns = [
      { regex: /console\.log\(/g, title: 'Console Log in Production', severity: 'low', desc: 'Debug logging found. Should be removed for production.' },
      { regex: /eval\(/g, title: 'Security Risk: eval()', severity: 'critical', desc: 'Use of eval() is a major security vulnerability.' },
      { regex: /innerHTML\s*=/g, title: 'Security Risk: innerHTML', severity: 'high', desc: 'Potential XSS vulnerability. Use textContent instead.' },
      { regex: /TODO|FIXME/gi, title: 'Technical Debt', severity: 'medium', desc: 'Unresolved TODO or FIXME comment found.' },
      { regex: /==\s*null|==\s*undefined/g, title: 'Loose Equality Check', severity: 'low', desc: 'Prefer strict equality (===) over loose equality (==).' }
    ];

    for (const file of files) {
      for (const p of patterns) {
        const matches = file.content.matchAll(p.regex);
        for (const m of matches) {
          const line = file.content.substring(0, m.index).split('\n').length;
          bugs.push({
            id: Math.random().toString(36).substring(7),
            title: p.title,
            file: file.path,
            line,
            description: p.desc,
            severity: p.severity
          });
          if (bugs.length > 20) break;
        }
        if (bugs.length > 20) break;
      }
    }
    return bugs.slice(0, 10);
  }

  /**
   * Static performance detection
   */
  static detectPerformance(files) {
    const issues = [];
    const patterns = [
      { regex: /useEffect\(\(\s*\)\s*=>\s*\{[^}]*\},\s*\[\s*\]\s*\)/g, title: 'Empty Dependency Array', severity: 'low', desc: 'Ensure this effect only needs to run once. Otherwise, specify dependencies.' },
      { regex: /\.map\(\s*\([^)]*\)\s*=>\s*\{[^}]*\}\s*\)/g, title: 'Inline Mapping', severity: 'low', desc: 'Consider moving complex mapping logic outside of the render cycle.' },
      { regex: /@import/g, title: 'CSS Import', severity: 'medium', desc: 'Using @import in CSS can delay page rendering.' },
      { regex: /document\.querySelector/g, title: 'DOM Querying', severity: 'low', desc: 'Frequent DOM querying can be slow. Consider caching references.' }
    ];

    for (const file of files) {
      for (const p of patterns) {
        const matches = file.content.matchAll(p.regex);
        for (const m of matches) {
          const line = file.content.substring(0, m.index).split('\n').length;
          issues.push({
            id: Math.random().toString(36).substring(7),
            title: p.title,
            file: file.path,
            line,
            description: p.desc,
            severity: p.severity
          });
          if (issues.length > 10) break;
        }
      }
    }
    return issues;
  }

  /**
   * Calculates basic complexity and quality metrics including language breakdown
   */
  static calculateMetrics(files, duplicates = [], unusedExports = []) {
    let totalLines = 0;
    let totalBytes = 0;
    let complexFiles = 0;
    const langMap = new Map();

    files.forEach(file => {
      totalLines += (file.lines || 0);
      totalBytes += (file.size || 0);
      
      const lang = this.getLanguageName(file.extension);
      const current = langMap.get(lang) || { name: lang, bytes: 0 };
      current.bytes += file.size;
      langMap.set(lang, current);

      // More sensitive complexity check
      const complexitySignals = [
        (file.content.match(/function /g) || []).length * 2,
        (file.content.match(/if |else |switch |case /g) || []).length,
        (file.content.match(/map\(|filter\(|reduce\(/g) || []).length,
        file.lines > 300 ? 5 : 0
      ];
      
      const totalComplexity = complexitySignals.reduce((a, b) => a + b, 0);
      if (totalComplexity > 20) complexFiles++;
    });

    const languages = Array.from(langMap.values()).map(l => ({
      ...l,
      percent: Math.round((l.bytes / totalBytes) * 100)
    })).sort((a, b) => b.bytes - a.bytes);

    // Realistic quality score
    let score = 100;
    score -= (complexFiles * 4);
    score -= (duplicates.length * 2);
    score -= (unusedExports.length * 1);
    score -= (totalLines > 5000 ? 5 : 0);

    return {
      files: files.length,
      lines: totalLines,
      complexity: Math.min(10, Math.round((complexFiles / (files.length || 1)) * 15)),
      qualityScore: Math.max(15, Math.round(score)),
      coverage: 0,
      languages
    };
  }

  /**
   * Generates a nested folder tree from flat file paths
   */
  static generateFolderStructure(files) {
    const root = { name: 'Repository Root', kind: 'dir', children: [] };
    
    for (const file of files) {
      const parts = file.path.split('/');
      let current = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;

        const isLast = i === parts.length - 1;
        let existing = current.children.find(c => c.name === part);
        
        if (!existing) {
          existing = { 
            name: part, 
            kind: isLast ? 'file' : 'dir', 
            children: isLast ? undefined : [] 
          };
          current.children.push(existing);
        }
        
        current = existing;
      }
    }
    
    // Sort: directories first, then files, both alphabetically
    const sortNodes = (node) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortNodes);
      }
    };
    
    sortNodes(root);

    // If there's only one child and it's a directory, make it the root to reduce nesting
    if (root.children.length === 1 && root.children[0].kind === 'dir') {
      return root.children[0];
    }
    
    return root;
  }

  /**
   * Detects libraries from package.json if it exists
   */
  static detectLibraries(files) {
    // Find all package.json files and pick the one closest to the root (shortest path)
    const pkgFiles = files
      .filter(f => f.path.endsWith('package.json'))
      .sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    if (pkgFiles.length === 0) return [];
    
    const pkgFile = pkgFiles[0];

    try {
      const pkg = JSON.parse(pkgFile.content);
      const libs = [];

      const add = (deps, type) => {
        if (!deps) return;
        for (const [name, version] of Object.entries(deps)) {
          libs.push({
            name,
            version: String(version).replace(/[\^~]/g, ''),
            type,
            purpose: this.guessPurpose(name)
          });
        }
      };

      add(pkg.dependencies, 'runtime');
      add(pkg.devDependencies, 'dev');
      add(pkg.peerDependencies, 'peer');

      return libs;
    } catch (e) {
      console.error("[STATIC_ANALYSIS] Failed to parse package.json:", e.message);
      return [];
    }
  }

  static guessPurpose(name) {
    const n = name.toLowerCase();
    if (n.includes('react')) return 'UI Framework/Library';
    if (n.includes('tailwind') || n.includes('css') || n.includes('styled')) return 'Styling';
    if (n.includes('test') || n.includes('jest') || n.includes('vitest') || n.includes('cypress')) return 'Testing';
    if (n.includes('lucide') || n.includes('icon') || n.includes('fontawesome')) return 'Icons';
    if (n.includes('vite') || n.includes('webpack') || n.includes('babel')) return 'Build Tool';
    if (n.includes('router')) return 'Navigation';
    if (n.includes('state') || n.includes('redux') || n.includes('zustand')) return 'State Management';
    return 'Utility / Dependency';
  }

  /**
   * Detects credential patterns in code (env vars, config keys)
   */
  static detectCredentials(files) {
    const credentials = new Map();
    // Support both Node.js (process.env) and Vite/Next.js (import.meta.env / NEXT_PUBLIC)
    const envRegex = /(?:process\.env|import\.meta\.env)\.([A-Z_0-9]+)/g;

    for (const file of files) {
      const matches = file.content.matchAll(envRegex);
      for (const match of matches) {
        const name = match[1];
        if (!credentials.has(name) && name.length > 3) {
          credentials.set(name, {
            name,
            required: !name.includes('OPTIONAL'),
            description: `Environment variable detected in ${file.path}`,
            where: file.path,
            example: 'YOUR_' + name
          });
        }
      }
    }

    return Array.from(credentials.values());
  }

  /**
   * Simple duplicate detection using a sliding window of code lines
   */
  static findDuplicates(files, minLines = 5) {
    const duplicates = [];
    const signatures = new Map();

    for (const file of files) {
      // Skip potentially minified files (very long lines, very few lines)
      if (file.content.length > 5000 && file.content.split('\n').length < 5) continue;

      const lines = file.content.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 20)
        .slice(0, 1000); // Limit analysis to first 1000 interesting lines
      
      for (let i = 0; i <= lines.length - minLines; i++) {
        const snippet = lines.slice(i, i + minLines).join('\n');
        // Use a faster hash or just the snippet itself if it's short
        const hash = snippet.length > 100 ? Buffer.from(snippet.substring(0, 200)).toString('base64') : snippet;

        if (signatures.has(hash)) {
          const original = signatures.get(hash);
          if (original.path !== file.path) {
            duplicates.push({
              id: Math.random().toString(36).substring(7),
              files: [original.path, file.path],
              lines: minLines,
              similarity: 1.0,
              snippet: snippet.substring(0, 150) + "..."
            });
            
            // Limit total duplicates found to keep it snappy
            if (duplicates.length >= 15) return duplicates;
            break; // Move to next file after finding one duplicate to avoid O(N^2) explosion
          }
        } else {
          signatures.set(hash, { path: file.path, snippet });
        }
      }
    }

    return duplicates;
  }

  /**
   * Detects functions that are exported but potentially not used
   */
  static findUnusedExports(files) {
    const exports = new Set();
    const usages = new Set();

    files.forEach(file => {
      // Very basic regex-based export/import detection
      const exportMatches = file.content.matchAll(/export (?:const|function|class) (\w+)/g);
      for (const match of exportMatches) {
        exports.add(match[1]);
      }

      const importMatches = file.content.matchAll(/import .*?(\w+).*? from/g);
      for (const match of importMatches) {
        usages.add(match[1]);
      }
    });

    const unused = Array.from(exports).filter(exp => !usages.has(exp));
    return unused.map(name => ({ name, type: 'Potential Unused Export' }));
  }

  static getLanguageName(ext) {
    const names = {
      '.js': 'JavaScript', '.jsx': 'React', '.ts': 'TypeScript', '.tsx': 'React TS',
      '.py': 'Python', '.go': 'Go', '.java': 'Java', '.html': 'HTML', '.css': 'CSS'
    };
    return names[ext] || 'Other';
  }
}
