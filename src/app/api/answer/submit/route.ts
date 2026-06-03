import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateAIJSON } from "@/lib/ai";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session_id, question_id, answer_text } = await req.json();
  if (!question_id || !answer_text?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();

  // Verify question belongs to session
  const question = db.prepare("SELECT * FROM questions WHERE id = ? AND session_id = ?").get(question_id, session_id) as any;
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  let answerId: string;

  // Check if answer already exists
  const existing = db.prepare("SELECT * FROM answers WHERE question_id = ?").get(question_id) as any;

  if (existing) {
    db.prepare("UPDATE answers SET answer_text = ?, word_count = ? WHERE id = ?")
      .run(answer_text, answer_text.split(" ").length, existing.id);
    answerId = existing.id;
    db.prepare("DELETE FROM evaluations WHERE answer_id = ?").run(answerId);
  } else {
    answerId = uuid();
    db.prepare("INSERT INTO answers (id, question_id, answer_text, word_count) VALUES (?, ?, ?, ?)")
      .run(answerId, question_id, answer_text, answer_text.split(" ").length);
  }

  db.prepare("UPDATE questions SET is_answered = 1 WHERE id = ?").run(question_id);

  // Get AI Evaluation
  const evaluation = await generateAIJSON<any>(`
You are an expert interview evaluator. Score this answer honestly (0-100).

Question: ${question.question_text}
Type: ${question.question_type}
Expected hints: ${question.expected_hints || "None"}

Answer: ${answer_text}

Return ONLY valid JSON:
{
  "overall_score": number,
  "technical_score": number,
  "relevance_score": number,
  "communication_score": number,
  "structure_score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggested_answer": "string",
  "ai_feedback": "string (short feedback)"
}
`);

  const evalId = uuid();
  db.prepare(`
    INSERT INTO evaluations (
      id, answer_id, overall_score, technical_score, relevance_score, 
      communication_score, structure_score, strengths, weaknesses, 
      suggested_answer, ai_feedback
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    evalId, answerId, 
    evaluation.overall_score || 50,
    evaluation.technical_score || null,
    evaluation.relevance_score || 70,
    evaluation.communication_score || 60,
    evaluation.structure_score || 60,
    JSON.stringify(evaluation.strengths || []),
    JSON.stringify(evaluation.weaknesses || []),
    evaluation.suggested_answer || "",
    evaluation.ai_feedback || ""
  );

  // === CRITICAL: Check if ALL questions are answered ===
  const unanswered = db.prepare(`
    SELECT COUNT(*) as count FROM questions 
    WHERE session_id = ? AND is_answered = 0
  `).get(session_id) as any;

  if (unanswered.count === 0) {
    // Calculate average score
    const scores = db.prepare(`
      SELECT e.overall_score FROM evaluations e 
      JOIN answers a ON e.answer_id = a.id 
      WHERE a.question_id IN (SELECT id FROM questions WHERE session_id = ?)
    `).all(session_id) as any[];

    const avgScore = scores.length > 0 
      ? scores.reduce((sum: number, row: any) => sum + (row.overall_score || 0), 0) / scores.length 
      : 0;

    db.prepare(`
      UPDATE interview_sessions 
      SET status = 'completed', 
          completed_at = datetime('now'), 
          overall_score = ? 
      WHERE id = ?
    `).run(Math.round(avgScore), session_id);

    console.log(`✅ Session ${session_id} marked as completed with score ${Math.round(avgScore)}%`);
  }

  return NextResponse.json({ evaluation });
}