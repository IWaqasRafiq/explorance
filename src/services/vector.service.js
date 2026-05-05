import CodeChunk from '../models/CodeChunk.js';

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

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
    if (process.env.NODE_ENV === 'production') {
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
    const useGemini = !!GEMINI_API_KEY;
    const geminiTimeoutMs = toPositiveInt(process.env.EMBEDDING_GEMINI_TIMEOUT_MS, 10000);
    const ollamaTimeoutMs = toPositiveInt(process.env.EMBEDDING_OLLAMA_TIMEOUT_MS, 30000);

    try {
      if (useGemini) {
        // Production: Use Google Gemini Embedding API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text }] }
          }),
          signal: AbortSignal.timeout(geminiTimeoutMs)
        });

        if (!response.ok) throw new Error(`Gemini Embedding Error: ${response.statusText}`);
        const data = await response.json();
        
        if (data.embedding?.values) {
          return data.embedding.values;
        } else {
          console.error("[VECTOR_SERVICE] Unexpected Gemini embedding response:", data);
          throw new Error("Invalid embedding response from Gemini");
        }
      } else {
        // Development: Use Local Ollama
        const response = await fetch('http://localhost:11434/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nomic-embed-text',
            prompt: text
          }),
          signal: AbortSignal.timeout(ollamaTimeoutMs)
        });

        if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
        
        const data = await response.json();
        if (data.embedding) return data.embedding;
        throw new Error("No embedding returned from Ollama");
      }
    } catch (error) {
      console.error("[VECTOR_SERVICE] Failed to generate embedding:", error.message);
      // Return a zero-vector as fallback
      return new Array(768).fill(0); 
    }
  }

  /**
   * Stores chunks in MongoDB with embeddings
   */
  static async storeChunks(projectId, chunks, onProgress) {
    if (!chunks || chunks.length === 0) return;
    
    console.log(`[VECTOR_SERVICE] Processing ${chunks.length} chunks for project ${projectId}...`);
    const useGemini = !!process.env.GEMINI_API_KEY;
    const defaultBatchSize = useGemini ? 12 : 30;
    const BATCH_SIZE = toPositiveInt(process.env.EMBEDDING_BATCH_SIZE, defaultBatchSize);

    // Process in batches
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
        const percent = Math.min(100, Math.round(((i + BATCH_SIZE) / chunks.length) * 100));
        const overallProgress = 40 + Math.round((percent / 100) * 50);
        await onProgress(overallProgress, `Vectorizing code (${percent}%)...`);
      }
    }

    console.log(`[VECTOR_SERVICE] Successfully stored all chunks.`);
  }

  /**
   * Performs vector search
   * In production, this uses MongoDB Atlas Vector Search ($vectorSearch)
   * In development, it falls back to local cosine similarity calculation
   */
  static async searchSimilar(projectId, queryText, limit = 5) {
    const queryEmbedding = await this.generateEmbedding(queryText);
    
    // Check if we should use Atlas Vector Search
    const useAtlasVector = process.env.USE_MONGODB_VECTOR === 'true';

    if (useAtlasVector) {
      try {
        console.log("[VECTOR_SERVICE] Using Atlas Vector Search...");
        return await CodeChunk.aggregate([
          {
            "$vectorSearch": {
              "index": "vector_index", // Name of your Atlas Vector Search index
              "path": "embedding",
              "queryVector": queryEmbedding,
              "numCandidates": 100,
              "limit": limit,
              "filter": { "projectId": projectId }
            }
          }
        ]);
      } catch (error) {
        console.error("[VECTOR_SERVICE] Atlas Vector Search failed, falling back to local search:", error.message);
      }
    }

    // Local Fallback (MVP version)
    console.log("[VECTOR_SERVICE] Using local similarity search (fallback)...");
    const allChunks = await CodeChunk.find({ projectId }).select('content metadata embedding');
    
    const results = allChunks.map(chunk => ({
      ...chunk.toObject(),
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding || [])
    }));

    return results
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);
  }

  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}
