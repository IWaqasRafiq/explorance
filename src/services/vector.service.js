import CodeChunk from '../models/CodeChunk.js';

export class VectorService {
  /**
   * Checks if Ollama is running and has the required model
   */
  static async isAvailable() {
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
      throw error;
    }
  }

  /**
   * Stores chunks in MongoDB with embeddings
   * @param {string} projectId 
   * @param {Array<{content: string, metadata: Object}>} chunks 
   */
  static async storeChunks(projectId, chunks) {
    console.log(`[VECTOR_SERVICE] Generating embeddings for ${chunks.length} chunks...`);
    
    const available = await this.isAvailable();
    if (!available) {
      console.warn("[VECTOR_SERVICE] Ollama not available, skipping embeddings. Semantic search will be disabled.");
      // Still store the chunks but without embeddings
      const processedChunks = chunks.map(chunk => ({
        projectId,
        content: chunk.content,
        embedding: [], // Empty embedding
        metadata: chunk.metadata
      }));
      await CodeChunk.insertMany(processedChunks);
      return;
    }

    // Process in larger batches to speed up local processing
    const BATCH_SIZE = 30;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (chunk) => {
        try {
          const embedding = await this.generateEmbedding(chunk.content);
          return {
            projectId,
            content: chunk.content,
            embedding,
            metadata: chunk.metadata
          };
        } catch (e) {
          return {
            projectId,
            content: chunk.content,
            embedding: [],
            metadata: chunk.metadata
          };
        }
      });

      const processedBatch = await Promise.all(batchPromises);
      await CodeChunk.insertMany(processedBatch);
      
      const progress = Math.min(100, Math.round(((i + BATCH_SIZE) / chunks.length) * 100));
      console.log(`[VECTOR_SERVICE] Progress: ${progress}%`);
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
