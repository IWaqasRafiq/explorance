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

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const useGemini = process.env.NODE_ENV === 'production' && !!GEMINI_API_KEY;

    console.log(`[CHAT_SERVICE] Sending request to ${useGemini ? 'Gemini' : 'local LLM'}...`);

    try {
      if (useGemini) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              role: 'user', 
              parts: [{ text: systemPrompt + "\n\nUSER QUESTION: " + query }] 
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1000,
            }
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) throw new Error(`Gemini Error: ${response.statusText}`);
        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        } else {
          console.error("[CHAT_SERVICE] Unexpected Gemini response:", data);
          throw new Error("Invalid Gemini response format");
        }
      } else {
        const response = await client.chat.completions.create({
          model: 'llama3',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.2,
        }, { timeout: 60000 });

        return response.choices[0].message.content;
      }
    } catch (error) {
      console.error("[CHAT_SERVICE] LLM Error:", error.message);
      return `I encountered an error while processing your request: ${error.message}. Please try again later.`;
    }
  }
}
