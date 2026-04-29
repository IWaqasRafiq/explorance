import { GoogleGenAI } from '@google/genai';

let geminiClient = null;

export const getGemini = () => {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set in environment variables');
    }
    // Initialize the official Google Gen AI SDK
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return geminiClient;
};
