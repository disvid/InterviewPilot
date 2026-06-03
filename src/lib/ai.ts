// src/lib/ai.ts - Groq with better JSON handling
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateAI(prompt: string, jsonMode = false): Promise<string> {
  try {
    console.log("🔄 Using Groq AI...");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: jsonMode 
            ? "You are a precise assistant. Respond ONLY with valid JSON. No explanations, no markdown, no extra text." 
            : "You are a helpful interview coach."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (error: any) {
    console.error("Groq Error:", error);
    throw new Error(`Groq request failed: ${error.message}`);
  }
}

export async function generateAIJSON<T>(prompt: string): Promise<T> {
  let text = await generateAI(prompt, true);
  
  console.log("Raw AI Response:", text.substring(0, 300) + "...");

  let cleaned = text
    .replace(/```json|```/g, "")
    .trim();

  // Improved JSON extraction - handles both arrays and objects
  const jsonStart = cleaned.indexOf("[");
  const jsonStartObj = cleaned.indexOf("{");
  
  let start = -1;
  let end = -1;

  if (jsonStart !== -1 && (jsonStartObj === -1 || jsonStart < jsonStartObj)) {
    // It's an array
    start = jsonStart;
    end = cleaned.lastIndexOf("]");
  } else if (jsonStartObj !== -1) {
    // It's an object
    start = jsonStartObj;
    end = cleaned.lastIndexOf("}");
  }

  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    const parsed = JSON.parse(cleaned) as T;
    console.log("✅ JSON parsed successfully");
    return parsed;
  } catch (e) {
    console.error("❌ Final JSON Parse Failed. Cleaned text:", cleaned);
    throw new Error("Failed to parse AI response as JSON");
  }
}