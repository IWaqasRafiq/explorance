import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { repoQueue } from '@/lib/queue';

export async function POST(req) {
  try {
    const { repoUrl } = await req.json();
    if (!repoUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const parts = repoUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });

    await connectDB();

    // 1. Check for existing project or create new one to start background analysis ASAP
    let project = await Project.findOne({ repoUrl }).sort({ createdAt: -1 });
    let jobId = project?.jobId;

    if (!project || project.status === 'failed') {
      project = await Project.create({
        repoUrl,
        status: 'pending',
        stage: 'Scouting initiated...'
      });

      const job = await repoQueue.add('analyze-repo', {
        projectId: project._id,
        repoUrl: project.repoUrl,
      });

      jobId = job.id;
      project.jobId = jobId;
      await project.save();
      console.log(`[SCOUT] Started background analysis for new project: ${project._id}`);
    }

    // 2. Fetch basics from GitHub (Fast)
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
Role: Senior Repo Scout & QA Architect.
Repo: ${owner}/${repo}
Files: ${fileList}
README snippet: ${readme.substring(0, 1000)}
Stars: ${repoData.stargazers_count}
Updated: ${repoData.pushed_at}

Generate a "Quick Look" JSON report for a developer who wants an instant QA assessment.
{
  "pitch": "2-sentence high-level summary of what this is",
  "personality": "Witty description of the codebase vibe (e.g. 'Enterprise Serious', 'Hacker Prototype')",
  "stack": ["tech1", "tech2"],
  "healthScore": 85, // 0-100 score based on initial look
  "qaRedFlags": ["List 2-3 potential risks based on top-level files or README"],
  "gems": [{"title": "Gem 1", "description": "..."}, {"title": "Gem 2", "description": "..."}],
  "momentum": "Description of activity level",
  "funFact": "Fun tech fact related to this repo",
  "syncProgress": "25"
}
JSON ONLY.
`;

    // Detect stack and gems from static data if AI fails
    const staticStack = [repoData.language].filter(Boolean);
    if (fileList.includes('package.json')) staticStack.push('Node.js');
    if (fileList.includes('tsconfig.json')) staticStack.push('TypeScript');
    if (fileList.includes('docker-compose.yml') || fileList.includes('Dockerfile')) staticStack.push('Docker');
    if (fileList.includes('next.config')) staticStack.push('Next.js');

    const defaultReport = {
      pitch: repoData.description || "A high-potential codebase with a modern structure.",
      personality: "Clean, professional, and ready for deep auditing.",
      stack: staticStack.length > 0 ? staticStack : ["Web Tech"],
      healthScore: 80,
      qaRedFlags: ["Deep audit in progress to verify test coverage and security patterns."],
      gems: [
        { title: "Active Development", description: `Regular updates detected (Last pushed: ${new Date(repoData.pushed_at).toLocaleDateString()})` },
        { title: "Community Backed", description: `Strong community interest with ${repoData.stargazers_count} stars.` }
      ],
      momentum: `${repoData.stargazers_count} stars and active push history.`,
      funFact: "Did you know? The first version of this project's core tech was likely written in under a week.",
      syncProgress: "20"
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
        } else if (data.error && data.error.code === 429) {
          console.warn("[SCOUT] Gemini 429: Using high-fidelity static fallback.");
          report = { 
            ...defaultReport, 
            personality: "Efficient & focused. (AI preview limited, using local heuristics)" 
          };
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

    // Attach project/job info for the UI to track
    report.projectId = project._id;
    report.jobId = jobId;
    report.status = project.status;

    return NextResponse.json(report);
  } catch (error) {
    console.error("Scout API Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
