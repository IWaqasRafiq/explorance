import { getGemini } from '../lib/gemini.js';

export class AIService {
  static async analyzeFiles(files) {
    const ai = getGemini();
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const fileSummaries = files.map(f => ({
      path: f.path,
      content: f.content.substring(0, 2000),
    })).slice(0, 30);
    
    const prompt = `
You are an expert AI software architect. Analyze the following repository files and provide a comprehensive structured report.
Return the output STRICTLY as a JSON object with the following schema exactly (with no markdown wrappers):
{
  "summary": "A 2-3 sentence overview of what the application does.",
  "purpose": "A longer description of the project's goals and architecture.",
  "qualityScore": 85,
  "metrics": { "files": 120, "lines": 5000, "complexity": 12.5, "coverage": 80 },
  "languages": [ { "name": "TypeScript", "percent": 80, "bytes": 100000 } ],
  "bugs": [ { "id": "b_1", "title": "Bug title", "file": "path", "line": 15, "severity": "high", "description": "Desc" } ],
  "performance": [ { "id": "p_1", "title": "Perf title", "file": "path", "line": 20, "severity": "medium", "description": "Desc" } ],
  "duplicates": [ { "id": "d_1", "files": ["path1", "path2"], "lines": 30, "similarity": 0.95, "snippet": "code snippet" } ],
  "libraries": [ { "name": "react", "version": "18.0", "type": "runtime", "purpose": "UI" } ],
  "folderStructure": { "name": "root", "kind": "dir", "description": "root", "children": [ { "name": "src", "kind": "dir", "description": "source", "children": [] } ] },
  "credentials": [ { "name": "API_KEY", "required": true, "description": "desc", "example": "key", "where": "how to get it" } ]
}

Files to analyze:
${JSON.stringify(fileSummaries, null, 2)}
`;

    // Use Gemini 1.5 Flash (most stable version)
    let retries = 3;
    let response;
    
    while (retries > 0) {
      try {
        console.log(`[AI SERVICE] Sending request to Gemini (Attempt ${4 - retries})...`);
        response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        });
        console.log(`[AI SERVICE] Received response from Gemini`);
        break; // Success, exit loop
      } catch (err) {
        retries--;
        console.error(`[AI SERVICE] Gemini API error:`, err.message);
        if (retries === 0 || (err.status !== 503 && err.status !== 429)) {
          throw err;
        }
        console.warn(`[AI SERVICE] Retrying in 2 seconds...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!response || !response.text) {
      throw new Error("Empty response from AI service");
    }

    const result = JSON.parse(response.text);
    return result;
  }
}
