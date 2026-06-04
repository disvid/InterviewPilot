import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { groqTranscribe } from "@/lib/ai";

const execAsync = promisify(exec);

async function convertToMp3(inputPath: string, outputPath: string): Promise<void> {
  const cmd = `ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -c:a libmp3lame -q:a 4 "${outputPath}"`;
  try {
    await execAsync(cmd);
  } catch (err: any) {
    throw new Error(`ffmpeg conversion failed: ${err.stderr || err.message}`);
  }
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const tmpDir = os.tmpdir();
  const id = `ip_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const ext = mimeType.includes("ogg")
    ? ".ogg"
    : mimeType.includes("mp4") || mimeType.includes("m4a")
    ? ".mp4"
    : mimeType.includes("wav")
    ? ".wav"
    : ".webm";

  const inputPath = path.join(tmpDir, `${id}${ext}`);
  const outputPath = path.join(tmpDir, `${id}.mp3`);

  try {
    fs.writeFileSync(inputPath, audioBuffer);
    console.log(`[transcribe] Saved input: ${inputPath} (${audioBuffer.length} bytes)`);

    await convertToMp3(inputPath, outputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("ffmpeg produced no output file");
    }

    const size = fs.statSync(outputPath).size;
    console.log(`[transcribe] Converted mp3: ${size} bytes`);

    if (size < 500) {
      throw new Error("Converted file too small — recording was probably silent or too short");
    }

    const text = await groqTranscribe(outputPath);
    console.log(`[transcribe] Result: "${text.slice(0, 100)}"`);
    return text;
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
  }
}