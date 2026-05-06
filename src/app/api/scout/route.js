import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { repoUrl } = await req.json();
    if (!repoUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const parts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });

    // Fetch basics from GitHub (Fast)
    const [repoRes, readmeRes, contentRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`),
      fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contents`)
    ]);

    const repoData = await repoRes.json();
    const readme = await readmeRes.text();
    const files = await contentRes.json();

    const fileList = Array.isArray(files) ? files.map(f => f.name).join(', ') : '';

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL_TEXT || 'gemini-2.0-flash';
    
    const prompt = `
Role: Repo Scout.
Repo: ${owner}/${repo}
Files: ${fileList}
README snippet: ${readme.substring(0, 1000)}
Stars: ${repoData.stargazers_count}
Updated: ${repoData.pushed_at}

Generate a "Quick Look" JSON report:
{
  "pitch": "2-sentence elevator pitch",
  "personality": "Witty description of vibe",
  "stack": ["tech1", "tech2"],
  "gems": [{"title": "Gem 1", "description": "..."}, {"title": "Gem 2", "description": "..."}],
  "momentum": "Description of activity level",
  "funFact": "Fun tech fact related to this repo",
  "syncProgress": "85"
}
JSON ONLY.
`;

    const defaultReport = {
      pitch: repoData.description || "A fascinating project with a clean codebase.",
      personality: "Meticulously organized and ready for action.",
      stack: [repoData.language || "JavaScript"],
      gems: [
        { title: "Clean Architecture", description: "Logical file structure detected." },
        { title: "Active Pulse", description: `Last updated ${new Date(repoData.pushed_at).toLocaleDateString()}` }
      ],
      momentum: `Strong momentum with ${repoData.stargazers_count} stars!`,
      funFact: "The first version of GitHub was written in Ruby on Rails.",
      syncProgress: "80"
    };

    let report;
    if (GEMINI_API_KEY) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
          })
        });
        const data = await res.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          report = JSON.parse(data.candidates[0].content.parts[0].text);
        } else {
          console.error("Gemini API unexpected response:", data);
          report = defaultReport;
        }
      } catch (geminiError) {
        console.error("Gemini call failed, using fallback:", geminiError);
        report = defaultReport;
      }
    } else {
      report = defaultReport;
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Scout API Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
