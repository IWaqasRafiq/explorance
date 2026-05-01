import { ChunkingService } from '../services/chunking.service.js';

async function testChunking() {
  console.log(`--- Step 3 Verification ---`);

  const mockFile = {
    path: 'src/app.js',
    extension: '.js',
    content: `
function heavyLogicPart1() {
  console.log("Doing something...");
}

function heavyLogicPart2() {
  console.log("Doing something else...");
}

/**
 * A very long comment block that might span across chunks
 * to test if the overlap keeps the context alive.
 */
class Processor {
  constructor() {
    this.data = [];
  }
  
  process() {
    return this.data.map(item => item * 2);
  }
}
`.repeat(20) // Make it large enough to force multiple chunks
  };

  console.log(`Input size: ${mockFile.content.length} characters`);
  
  const chunks = ChunkingService.processFiles([mockFile], { chunkSize: 1000, chunkOverlap: 200 });

  console.log(`Total Chunks: ${chunks.length}\n`);

  // Inspect the first two chunks to verify overlap
  chunks.slice(0, 2).forEach((chunk, i) => {
    console.log(`--- Chunk ${i + 1} ---`);
    console.log(`Metadata:`, JSON.stringify(chunk.metadata));
    console.log(`Content Sample (Start): ${chunk.content.substring(0, 100).replace(/\n/g, ' ')}...`);
    console.log(`Content Sample (End): ...${chunk.content.substring(chunk.content.length - 100).replace(/\n/g, ' ')}`);
    console.log('');
  });

  console.log(`Step 3 Complete.`);
}

testChunking();
