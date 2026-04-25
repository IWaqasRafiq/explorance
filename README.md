Explorance - AI Code Review

1. Project Setup
1. Install Dependencies:
npm install
2. Run Development Server:
npm run dev
2. How It Works
The app uses Next.js for the frontend and LangGraph for the AI pipeline.

Key Components:

@/app/api/agent/route.js: The entry point that receives the GitHub URL.
@/graph/graph.js: The core LangGraph workflow definition.
@/agent/pipeline.js: The sequential chain combining:
Static analysis using semgrep (via subprocess).
AI analysis using OpenAI.
@/agent/llm-chain.js: The prompt engineering and model calling logic.
@/utils/index.js: Helper functions for file operations and Git.
3. Testing
You can test the backend endpoint directly:

Request: POST http://localhost:3000/api/agent
Body:
{
  "url": "https://github.com/react-icons/react-icons"
}
Response: JSON containing the analysis report.

4. Folder Structure
@/app: Next.js pages (frontend).
@/api: API routes.
@/graph: LangGraph state and workflow definitions.
@/agent: AI agent logic and prompts.
@/utils: Utility helpers.
@/components: UI components.
