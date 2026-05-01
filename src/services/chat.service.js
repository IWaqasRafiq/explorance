import OpenAI from 'openai';
import { VectorService } from './vector.service.js';

const client = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

export class ChatService {
  /**
   * Main RAG function: Retrieve context and generate an answer
   */
  static async askRepository(projectId, query) {
    console.log(`[CHAT_SERVICE] Searching for context for: "${query}"...`);
    
    // 1. Retrieve relevant code chunks (Top 5)
    const contextChunks = await VectorService.searchSimilar(projectId, query, 5);
    
    if (contextChunks.length === 0) {
      return "I couldn't find any relevant code in the repository to answer your question.";
    }

    // 2. Build the context string
    const contextString = contextChunks
      .map(c => `--- FILE: ${c.metadata.source} ---\n${c.content}`)
      .join('\n\n');

    // 3. Create the System Prompt
    const systemPrompt = `
You are an expert AI software architect. You are helping a developer understand their codebase.
Use the provided code snippets (CONTEXT) to answer the user's question.
If the context doesn't contain the answer, say you don't know based on the provided code.
Keep your answers technical, accurate, and concise.

CONTEXT:
${contextString}
`;

    console.log(`[CHAT_SERVICE] Sending request to local LLM...`);

    // 4. Generate response using Local LLM
    try {
      const response = await client.chat.completions.create({
        model: 'llama3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.2, // Keep it focused on the facts
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("[CHAT_SERVICE] LLM Error:", error.message);
      throw new Error(`Failed to get response from local LLM: ${error.message}`);
    }
  }
}
