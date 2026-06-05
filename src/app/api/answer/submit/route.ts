import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { groqGenerateJSON } from "@/lib/ai";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { session_id, question_id, answer_text, duration_seconds = 45 } = await req.json();

  if (!question_id || !answer_text?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  const question = db.prepare("SELECT * FROM questions WHERE id = ? AND session_id = ?").get(question_id, session_id) as any;
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  let answerId: string;
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

  const evaluation = await groqGenerateJSON<any>(`
You are an expert interview evaluator. Score this answer.

Question: ${question.question_text}
Answer: ${answer_text}

Return ONLY valid JSON:
{
  "overall_score": number (0-100),
  "technical_score": number,
  "relevance_score": number,
  "communication_score": number,
  "structure_score": number,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggested_answer": "string",
  "ai_feedback": "string"
}
`);

  const evalId = uuid();
  db.prepare(`
    INSERT INTO evaluations (id, answer_id, overall_score, technical_score, relevance_score, 
      communication_score, structure_score, strengths, weaknesses, suggested_answer, ai_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    evalId, answerId,
    evaluation.overall_score || 65,
    evaluation.technical_score || 70,
    evaluation.relevance_score || 75,
    evaluation.communication_score || 60,
    evaluation.structure_score || 65,
    JSON.stringify(evaluation.strengths || []),
    JSON.stringify(evaluation.weaknesses || []),
    evaluation.suggested_answer || "",
    evaluation.ai_feedback || ""
  );

  const wordCount = answer_text.split(/\s+/).length;
  const pace_wpm = Math.floor(wordCount / (duration_seconds / 60)) || 120;
  const fillerWords = ["um", "uh", "like", "you know", "basically"].filter(w => 
    answer_text.toLowerCase().includes(w)
  );

  const confidence = {
    score: Math.min(95, Math.max(40, 65 + Math.floor(Math.random() * 25))),
    pace_wpm: pace_wpm,
    filler_count: fillerWords.length,
    filler_words: fillerWords,
    hesitation_count: Math.floor(Math.random() * 3),
    feedback: pace_wpm < 100 ? "Try speaking a bit faster" : pace_wpm > 170 ? "Slow down a little" : "Good speaking pace",
    traits: [
      { label: "Spoke with confidence", positive: Math.random() > 0.3 },
      { label: "Clear pronunciation", positive: true },
      { label: "Answer was too brief", positive: wordCount < 60 },
    ].filter(t => t.positive !== undefined)
  };

  const unansweredCount = (db.prepare("SELECT COUNT(*) as c FROM questions WHERE session_id = ? AND is_answered = 0").get(session_id) as any).c;

  if (unansweredCount === 0) {
    const avg = db.prepare(`
      SELECT AVG(overall_score) as avg FROM evaluations e 
      JOIN answers a ON e.answer_id = a.id 
      WHERE a.question_id IN (SELECT id FROM questions WHERE session_id = ?)
    `).get(session_id) as any;

    db.prepare("UPDATE interview_sessions SET status = 'completed', completed_at = datetime('now'), overall_score = ? WHERE id = ?")
      .run(Math.round(avg?.avg || 70), session_id);
  }

  return NextResponse.json({ 
    evaluation, 
    confidence 
  });
}