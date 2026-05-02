import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';

export class GithubService {
  /**
   * Clones a repository into a temporary directory
   * @param {string} repoUrl 
   * @returns {Promise<string>} The path to the cloned repository
   */
  static async cloneRepo(repoUrl) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-'));
    
    // For GitHub URLs, use the ZIP download approach to avoid needing the git binary in production
    // This is much faster and works in serverless environments like Vercel
    if (repoUrl.includes('github.com')) {
      try {
        console.log(`[GITHUB_SERVICE] Using ZIP download for ${repoUrl}`);
        return await this.downloadRepoZip(repoUrl, tempDir);
      } catch (error) {
        console.warn(`[GITHUB_SERVICE] ZIP download failed, falling back to git clone: ${error.message}`);
        // If ZIP fails, we'll try git clone below
      }
    }

    // Disable all forms of interactivity to prevent hanging on Windows
    const git = simpleGit({ 
      env: { 
        ...process.env, 
        GIT_TERMINAL_PROMPT: '0',
        GCM_INTERACTIVE: 'never',
        GIT_ASKPASS: 'echo',
        SSH_ASKPASS: 'echo',
        GIT_SSH_COMMAND: 'ssh -o BatchMode=yes'
      },
      unsafe: {
        allowUnsafeCredentialHelper: true
      }
    });
    
    try {
      console.log(`[GITHUB_SERVICE] Cloning ${repoUrl} to ${tempDir}`);
      
      // Increased timeout to 5 minutes as 60s is too short for some connections/repos
      const CLONE_TIMEOUT = 300000; 
      
      const clonePromise = git.clone(repoUrl, tempDir, [
        '-c', 'credential.helper=',
        '--depth', '1', 
        '--single-branch', 
        '--no-tags'
      ]);

      await Promise.race([
        clonePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Clone operation timed out (5m). The repository might be private or very large.')), CLONE_TIMEOUT)
        )
      ]);

      return tempDir;
    } catch (error) {
      // On Windows, cleanup might fail if git process is still holding a lock
      // We wait a moment before trying to cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.cleanupRepo(tempDir);
      console.error(`[GITHUB_SERVICE] Clone failed: ${error.message}`);
      
      if (error.message.includes('ENOENT')) {
        throw new Error('Git binary not found. This environment might not support git clone. Please ensure you are using a public GitHub URL.');
      }

      if (error.message.includes('terminal prompts disabled') || error.message.includes('Authentication failed')) {
        throw new Error('Authentication failed. Please ensure the repository is public.');
      }
      
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Downloads a repository as a ZIP and extracts it
   * @param {string} repoUrl 
   * @param {string} tempDir 
   * @returns {Promise<string>}
   */
  static async downloadRepoZip(repoUrl, tempDir) {
    // Extract owner and repo from URL
    // Supports: 
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.\?\#]+)/);
    if (!match) throw new Error('Invalid GitHub URL for ZIP download');
    
    const [_, owner, repo] = match;
    const zipUrl = `https://github.com/${owner}/${repo}/zipball/HEAD`;
    
    console.log(`[GITHUB_SERVICE] Downloading ZIP from ${zipUrl}`);
    
    const response = await fetch(zipUrl);
    if (!response.ok) {
      throw new Error(`Failed to download repository: ${response.statusText} (${response.status})`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const zip = new AdmZip(buffer);
    zip.extractAllTo(tempDir, true);
    
    // GitHub's zipball puts everything inside a subfolder (owner-repo-hash)
    // We need to move files up one level to keep the structure consistent
    const entries = await fs.readdir(tempDir);
    if (entries.length === 1) {
      const entryPath = path.join(tempDir, entries[0]);
      if ((await fs.stat(entryPath)).isDirectory()) {
        const subDir = entryPath;
        const files = await fs.readdir(subDir);
        for (const file of files) {
          await fs.move(path.join(subDir, file), path.join(tempDir, file));
        }
        await fs.remove(subDir);
      }
    }
    
    return tempDir;
  }

  /**
   * Deletes the temporary repository directory
   * @param {string} tempDir 
   */
  static async cleanupRepo(tempDir) {
    try {
      if (tempDir && await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }
    } catch (error) {
      console.error(`Failed to clean up repo at ${tempDir}:`, error);
    }
  }
}
