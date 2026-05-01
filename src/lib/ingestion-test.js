import { GithubService } from '../services/github.service.js';
import { FileService } from '../services/file.service.js';

async function testIngestion() {
  const testRepo = 'https://github.com/octocat/Spoon-Knife'; // A tiny public repo
  console.log(`--- Step 2 Verification ---`);
  console.log(`Testing ingestion for: ${testRepo}`);
  
  let tempDir = null;
  try {
    // 1. Clone
    tempDir = await GithubService.cloneRepo(testRepo);
    console.log(`✓ Repository cloned to: ${tempDir}`);
    
    // 2. Scan
    const files = await FileService.scanDirectory(tempDir);
    console.log(`✓ Successfully scanned ${files.length} files.`);
    
    // 3. Inspect a file
    if (files.length > 0) {
      console.log(`\nSample file metadata:`);
      const sample = files[0];
      console.log(`- Path: ${sample.path}`);
      console.log(`- Lines: ${sample.lines}`);
      console.log(`- Size: ${sample.size} bytes`);
    }

    console.log(`\nStep 2 Complete.`);
  } catch (error) {
    console.error(`\nIngestion test failed:`, error.message);
  } finally {
    if (tempDir) {
      await GithubService.cleanupRepo(tempDir);
      console.log(`✓ Cleanup complete.`);
    }
  }
}

testIngestion();
