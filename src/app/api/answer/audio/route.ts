import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { transcribeAudio } from "@/lib/transcribe";
import { submitAndEvaluateAnswer } from "@/lib/submit-answer";

// No `export const config` — that's deprecated in App Router
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const sessionId = formData.get("session_id") as string | null;
    const questionId = formData.get("question_id") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file received" }, { status: 400 });
    }
    if (!sessionId || !questionId) {
      return NextResponse.json(
        { error: "Missing session_id or question_id" },
        { status: 400 }
      );
    }
    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: "Audio file is empty — did recording start?" },
        { status: 400 }
      );
    }

    console.log(
      `[audio] ${(audioFile.size / 1024).toFixed(1)}KB, type: ${audioFile.type}`
    );

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe via ffmpeg → Groq Whisper
    let transcription: string;
    try {
      transcription = await transcribeAudio(buffer, audioFile.type || "audio/webm");
    } catch (err: any) {
      console.error("[audio] Transcription error:", err.message);
      return NextResponse.json(
        { error: `Transcription failed: ${err.message}` },
        { status: 500 }
      );
    }

    if (!transcription.trim()) {
      return NextResponse.json(
        { error: "Nothing was transcribed — please speak clearly and try again" },
        { status: 400 }
      );
    }

    // Evaluate
    const result = await submitAndEvaluateAnswer(
      sessionId,
      questionId,
      transcription.trim(),
      session.userId
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      transcription: transcription.trim(),
      evaluation: result.evaluation,
    });
  } catch (err: any) {
    console.error("[audio] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Audio processing failed" },
      { status: 500 }
    );
  }
}