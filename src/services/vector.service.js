import CodeChunk from '../models/CodeChunk.js';

export class VectorService {
  /**
   * Checks if Ollama is running and has the required model
   */
  /**
   * Checks if Ollama is running and has the required model
   */
  static async isAvailable() {
    // In production (Vercel), Ollama is never available on localhost.
    // Skip the 2s timeout wait to save time.
    if (process.env.GEMINI_API_KEY || process.env.NODE_ENV === 'production') {
      return false;
    }

    try {
      const response = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generates an embedding for a piece of text
   * @param {string} text 
   * @returns {Promise<number[]>}
   */
  static async generateEmbedding(text) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const isProd = !!GEMINI_API_KEY;

    try {
      if (isProd) {
        // Production: Use Google Gemini Embedding API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text }] }
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) throw new Error(`Gemini Embedding Error: ${response.statusText}`);
        const data = await response.json();
        
        if (!data.embedding || !data.embedding.values) {
          throw new Error("Invalid embedding response from Gemini");
        }
        
        return data.embedding.values;
      } else {
        // Development: Use Local Ollama
        const response = await fetch('http://localhost:11434/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: text
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
        
        const data = await response.json();
        return data.embedding;
      }
    } catch (error) {
      console.error("[VECTOR_SERVICE] Failed to generate embedding:", error.message);
      // Return a zero-vector as fallback to prevent the whole job from failing
      return new Array(768).fill(0); 
    }
  }

  /**
   * Stores chunks in MongoDB with embeddings
   * @param {string} projectId 
   * @param {Array<{content: string, metadata: Object}>} chunks 
   * @param {Function} onProgress Optional callback for progress updates
   */
  static async storeChunks(projectId, chunks, onProgress) {
    if (!chunks || chunks.length === 0) return;
    
    console.log(`[VECTOR_SERVICE] Processing ${chunks.length} chunks for project ${projectId}...`);
    
    const available = await this.isAvailable();
    const isProd = !!process.env.GEMINI_API_KEY;

    // In production, we use Gemini. In dev, we use Ollama.
    // If neither is available, we store without embeddings.
    if (!available && !isProd) {
      console.warn("[VECTOR_SERVICE] No embedding service available, storing raw chunks.");
      const processedChunks = chunks.map(chunk => ({
        projectId,
        content: chunk.content,
        embedding: [], 
        metadata: chunk.metadata
      }));
      await CodeChunk.insertMany(processedChunks);
      if (onProgress) await onProgress(90, 'Analysis complete...');
      return;
    }

    // Process in batches
    const BATCH_SIZE = isProd ? 10 : 30; // Smaller batches for Gemini to avoid rate limits
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (chunk) => {
        const embedding = await this.generateEmbedding(chunk.content);
        return {
          projectId,
          content: chunk.content,
          embedding,
          metadata: chunk.metadata
        };
      });

      const processedBatch = await Promise.all(batchPromises);
      await CodeChunk.insertMany(processedBatch);
      
      if (onProgress) {
        // Map 40-90% range for vector storage
        const percent = Math.min(100, Math.round(((i + BATCH_SIZE) / chunks.length) * 100));
        const overallProgress = 40 + Math.round((percent / 100) * 50);
        await onProgress(overallProgress, `Vectorizing code (${percent}%)...`);
      }
      
      console.log(`[VECTOR_SERVICE] Vector Storage Progress: ${i + batch.length}/${chunks.length}`);
    }

    console.log(`[VECTOR_SERVICE] Successfully stored all chunks.`);
  }

  /**
   * Performs a simple Cosine Similarity search locally (MVP version)
   * Note: In production, you'd use MongoDB Atlas Vector Search ($vectorSearch)
   */
  static async searchSimilar(projectId, queryText, limit = 5) {
    const queryEmbedding = await this.generateEmbedding(queryText);
    
    // Fetch all chunks for the project (Fine for small/medium repos)
    const allChunks = await CodeChunk.find({ projectId }).select('content metadata embedding');
    
    // Calculate cosine similarity
    const results = allChunks.map(chunk => ({
      ...chunk.toObject(),
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  static cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
