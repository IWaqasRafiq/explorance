import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class GithubService {
  /**
   * Clones a repository into a temporary directory
   * @param {string} repoUrl 
   * @returns {Promise<string>} The path to the cloned repository
   */
  static async cloneRepo(repoUrl) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-'));
    
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
      
      if (error.message.includes('terminal prompts disabled') || error.message.includes('Authentication failed')) {
        throw new Error('Authentication failed. Please ensure the repository is public.');
      }
      
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
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
