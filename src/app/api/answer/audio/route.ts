import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { transcribeAudio } from "@/lib/transcribe";
import { submitAndEvaluateAnswer } from "@/lib/submit-answer";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const sessionId = formData.get("session_id") as string | null;
    const questionId = formData.get("question_id") as string | null;
    const durationSeconds = parseFloat(formData.get("duration_seconds") as string || "30");

    if (!audioFile || !sessionId || !questionId)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (audioFile.size === 0)
      return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    console.log(`[audio] ${(buffer.length / 1024).toFixed(1)}KB type:${audioFile.type}`);

    let transcription: string;
    try {
      transcription = await transcribeAudio(buffer, audioFile.type || "audio/webm");
    } catch (err: any) {
      return NextResponse.json({ error: `Transcription failed: ${err.message}` }, { status: 500 });
    }

    if (!transcription.trim())
      return NextResponse.json({ error: "Nothing transcribed — speak clearly and try again" }, { status: 400 });

    const result = await submitAndEvaluateAnswer(
      sessionId, questionId, transcription.trim(), session.userId, durationSeconds
    );

    if (result.error) return NextResponse.json({ error: result.error }, { status: 404 });

    return NextResponse.json({
      transcription: transcription.trim(),
      evaluation: result.evaluation,
      confidence: result.confidence,
    });
  } catch (err: any) {
    console.error("[audio] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}