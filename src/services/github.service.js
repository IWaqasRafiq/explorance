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
    // Disable terminal prompt and Git Credential Manager to prevent hanging on Windows
    const git = simpleGit({ 
      env: { 
        ...process.env, 
        GIT_TERMINAL_PROMPT: '0',
        GCM_INTERACTIVE: 'never' 
      },
      unsafe: {
        allowUnsafeCredentialHelper: true
      }
    });
    
    try {
      // Added --single-branch, --no-tags, and --quiet to save memory and prevent stdout buffer hangs
      // Added -c credential.helper= to bypass Windows Git Credential Manager popups
      await git.clone(repoUrl, tempDir, [
        '-c', 'credential.helper=',
        '--depth', '1', 
        '--single-branch', 
        '--no-tags', 
        '--quiet'
      ]);
      return tempDir;
    } catch (error) {
      await this.cleanupRepo(tempDir);
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
