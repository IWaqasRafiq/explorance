import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // Ollama doesn't need a real key but the SDK requires one
});

async function verifyLLM() {
  console.log("--- LLM Verification ---");
  console.log("Connecting to Ollama at http://localhost:11434/v1...");
  
  try {
    // First, check available models
    const modelsRes = await fetch('http://localhost:11434/api/tags');
    if (modelsRes.ok) {
      const models = await modelsRes.json();
      console.log("\nAvailable models in Ollama:");
      if (models.models && models.models.length > 0) {
        models.models.forEach(m => console.log(`- ${m.name}`));
      } else {
        console.warn("- No models found. Please run 'ollama pull llama3' in your terminal.");
      }
    }

    const response = await client.chat.completions.create({
      model: 'llama3', // Default to llama3
      messages: [{ role: 'user', content: 'Say "Local LLM is online!"' }],
    });

    console.log("\nSuccess! Response from Ollama:");
    console.log(`> ${response.choices[0].message.content}`);
    console.log("\nStep 1 Complete.");
  } catch (error) {
    console.error("\nFailed to connect to Ollama.");
    if (error.code === 'ECONNREFUSED') {
      console.error("Error: Ollama is not running. Please start the Ollama application.");
    } else if (error.message.includes('404')) {
      console.error("Error: Model 'llama3' not found. Try running 'ollama pull llama3'.");
    } else {
      console.error("Error details:", error.message);
    }
    process.exit(1);
  }
}

verifyLLM();
