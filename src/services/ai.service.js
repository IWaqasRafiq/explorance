import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

export class AIService {
  /**
   * Checks if Ollama is running
   */
  static async isAvailable() {
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
   * Generates deep architectural insights based on file summaries and static analysis data
   */
  static async generateInsights(files, staticResults) {
    console.log(`[AI_SERVICE] Generating architectural insights for ${files.length} files...`);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const useGemini = process.env.NODE_ENV === 'production' && !!GEMINI_API_KEY;

    if (!useGemini) {
      const available = await this.isAvailable();
      if (!available) {
        console.warn("[AI_SERVICE] Ollama not available, returning basic insights.");
        return this.getFallbackInsights(files, staticResults);
      }
    }

    // Prepare a condensed summary of the most important files
    const fileList = files
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 20)
      .map(f => `- ${f.path} (${f.lines} lines)`)
      .join('\n');
    
    const prompt = `
Context: ${files.length} total files. Top 20:
${fileList}

Stats:
- Duplicates: ${staticResults.duplicates.length}
- Unused: ${staticResults.unusedCode.length}
- Quality Score: ${staticResults.metrics.qualityScore}/100

JSON Report Task:
1. "summary": 2-sentence project overview.
2. "recommendations": Top 3 refactoring tips.
3. "techStack": List main technologies.
4. "architectureStyle": (e.g., MVC, Component-based).
5. "purpose": 1-sentence technical purpose of the project.
6. "bugs": List 3 potential bugs {id, title, file, line, description, severity}.
7. "performance": List 3 bottlenecks {id, title, file, line, description, severity}.

JSON ONLY:
`;

    try {
      if (useGemini) {
        // Production: Use Google Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
          }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) throw new Error(`Gemini Error: ${response.statusText}`);
        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const content = data.candidates[0].content.parts[0].text;
          return JSON.parse(content);
        } else {
          console.error("[AI_SERVICE] Unexpected Gemini response:", data);
          throw new Error("Invalid Gemini response format");
        }
      } else {
        // Development: Use Local Ollama
        const response = await client.chat.completions.create({
          model: 'llama3',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }, { timeout: 120000 }); // 2 minute timeout for local Llama3

        const content = response.choices[0].message.content;
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
      }
    } catch (error) {
      console.error("[AI_SERVICE] Insight generation failed:", error.message);
      return this.getFallbackInsights(files, staticResults);
    }
  }

  static getFallbackInsights(files, staticResults) {
    const extensions = [...new Set(files.map(f => f.extension))];
    const isMissingKey = !process.env.GEMINI_API_KEY && process.env.NODE_ENV === 'production';
    
    return {
      summary: isMissingKey 
        ? "AI analysis is currently unavailable because no GEMINI_API_KEY was found in the environment."
        : "AI analysis timed out or failed. Showing results from static analysis.",
      purpose: staticResults.purpose || "Project detected from file structure.",
      recommendations: [
        "Check your environment variables for GEMINI_API_KEY.",
        "Ensure Ollama is running if in development mode.",
        "Review static analysis results below for immediate improvements."
      ],
      techStack: extensions.map(ext => ext.replace('.', '').toUpperCase()).filter(e => e !== 'OTHER'),
      architectureStyle: "Detected from file structure",
      bugs: staticResults.bugs || [],
      performance: staticResults.performance || []
    };
  }
}
