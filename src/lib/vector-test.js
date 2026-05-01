import { VectorService } from '../services/vector.service.js';
import { connectDB } from './db.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testVectors() {
  console.log(`--- Step 4 Verification ---`);
  
  try {
    await connectDB();
    console.log(`✓ Database connected.`);

    const mockProjectId = new mongoose.Types.ObjectId();
    const testChunks = [
      { content: "function login(user) { return auth.verify(user); }", metadata: { source: "auth.js" } },
      { content: "const databaseUrl = 'mongodb://localhost:27017';", metadata: { source: "config.js" } },
      { content: "function logout() { session.destroy(); }", metadata: { source: "auth.js" } }
    ];

    // 1. Test Store
    console.log(`Testing storage and embedding generation...`);
    await VectorService.storeChunks(mockProjectId, testChunks);

    // 2. Test Search
    console.log(`\nTesting Semantic Search for: "authentication"`);
    const results = await VectorService.searchSimilar(mockProjectId, "authentication", 1);
    
    if (results.length > 0) {
      console.log(`✓ Closest match found:`);
      console.log(`- Content: ${results[0].content}`);
      console.log(`- Similarity: ${results[0].similarity.toFixed(4)}`);
    }

    // Cleanup
    await mongoose.model('CodeChunk').deleteMany({ projectId: mockProjectId });
    console.log(`\n✓ Cleanup complete.`);
    console.log(`Step 4 Complete.`);
  } catch (error) {
    console.error(`\nVector test failed:`, error.message);
    if (error.message.includes('fetch')) {
      console.error("Tip: Ensure you ran 'ollama pull nomic-embed-text' and Ollama is running.");
    }
  } finally {
    await mongoose.disconnect();
  }
}

testVectors();
