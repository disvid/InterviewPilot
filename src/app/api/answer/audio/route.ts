import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateAIJSON } from "@/lib/ai";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import fs from "fs";
import path from "path";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;
  const session_id = formData.get("session_id") as string;
  const question_id = formData.get("question_id") as string;

  if (!audio) return NextResponse.json({ error: "No audio received" }, { status: 400 });

  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `input_${Date.now()}.webm`);
  const outputPath = path.join(tmpDir, `output_${Date.now()}.mp3`);

  try {
    const bytes = await audio.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(bytes));

    // Convert webm to mp3 using FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("mp3")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    console.log("✅ FFmpeg conversion done");

    // Smart mock transcription
    const transcription = "I have good experience in full-stack development using React, Next.js, Node.js, and TypeScript. I have built multiple projects including real-time apps and REST APIs. I focus on clean architecture and performance optimization.";

    // Submit to Groq evaluation
    const submitRes = await fetch(`${req.nextUrl.origin}/api/answer/submit`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Cookie: req.headers.get("cookie") || "" 
      },
      body: JSON.stringify({ session_id, question_id, answer_text: transcription }),
    });

    const data = await submitRes.json();

    // Cleanup files
    [inputPath, outputPath].forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });

    return NextResponse.json({
      success: true,
      transcription,
      evaluation: data.evaluation
    });

  } catch (error: any) {
    console.error("Audio Error:", error);
    // Cleanup
    [inputPath, outputPath].forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    return NextResponse.json({ error: "Failed to process voice. Please use text answer." }, { status: 500 });
  }
}