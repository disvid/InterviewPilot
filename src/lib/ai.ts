import Groq from "groq-sdk";
import fs from "fs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function groqGenerate(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are an expert assistant. When asked for JSON, respond ONLY with valid JSON — no markdown, no code fences, no explanation.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content?.trim() || "";
}

export async function groqGenerateJSON<T>(prompt: string): Promise<T> {
  const text = await groqGenerate(prompt);
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("[groq] JSON parse failed. Raw:", text.slice(0, 300));
    throw new Error(`Groq returned invalid JSON: ${(e as Error).message}`);
  }
}

export async function groqTranscribe(audioFilePath: string): Promise<string> {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath) as any,
    model: "whisper-large-v3-turbo",
    response_format: "text",
    language: "en",
  });
  return (
    typeof transcription === "string"
      ? transcription
      : (transcription as any).text || ""
  ).trim();
}

// NEW: Text-to-Speech using Groq PlayAI
export async function groqTextToSpeech(text: string): Promise<Buffer> {
  const response = await groq.audio.speech.create({
    model: "playai-tts",
    voice: "Fritz-PlayAI",
    input: text,
    response_format: "wav",
  } as any);

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}