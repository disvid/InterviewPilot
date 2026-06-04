import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitAndEvaluateAnswer } from "@/lib/submit-answer";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session_id, question_id, answer_text } = await req.json();

    if (!session_id || !question_id || !answer_text?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await submitAndEvaluateAnswer(
      session_id,
      question_id,
      answer_text,
      session.userId
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ evaluation: result.evaluation });
  } catch (err: any) {
    console.error("[submit] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}