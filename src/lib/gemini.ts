import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODELS = [
  "gemini-3.5-flash",           // Best current balance (recommended)
  "gemini-2.5-flash",           // Good alternative
  "gemini-3.1-flash-lite",      // Lightweight
  "gemini-3-flash",             // Fallback
];

export async function geminiGenerate(prompt: string, jsonMode = false): Promise<string> {
  let lastError = "";

  for (const modelName of MODELS) {
    try {
      console.log(`🔄 Trying model: ${modelName}`);

      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { 
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      });

      const fullPrompt = jsonMode
        ? prompt + "\n\nRespond ONLY with valid JSON. No markdown, no explanation, no code blocks."
        : prompt;

      const result = await model.generateContent(fullPrompt);
      const text = result.response.text().trim();

      console.log(`✅ Success with model: ${modelName}`);
      return text;

    } catch (error: any) {
      lastError = error?.message || String(error);
      console.warn(`❌ Model ${modelName} failed:`, lastError);

      if (error?.status === 429) {
        console.log("Quota exceeded, trying next model...");
        continue;
      }
      // For 404 or other permanent errors, try next model
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
}

export async function geminiGenerateJSON<T>(prompt: string): Promise<T> {
  const text = await geminiGenerate(prompt, true);
  
  let cleaned = text
    .replace(/```json|```/g, "")
    .replace(/^\s*[\r\n]+/gm, "")  // Remove empty lines
    .trim();

  // Extra safety: extract JSON if wrapped in text
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("JSON Parse Error:", cleaned);
    throw new Error("Failed to parse AI response as JSON");
  }
}