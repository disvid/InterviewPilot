import { getDb } from "@/lib/db";
import { groqGenerateJSON } from "@/lib/ai";
import { analyzeConfidence } from "@/lib/confidence";
import { v4 as uuid } from "uuid";

export async function submitAndEvaluateAnswer(
  sessionId: string,
  questionId: string,
  answerText: string,
  userId: string,
  durationSeconds?: number
): Promise<{ evaluation: any; confidence: any; error?: string }> {
  const db = getDb();

  const question = db
    .prepare("SELECT * FROM questions WHERE id = ? AND session_id = ?")
    .get(questionId, sessionId) as any;
  if (!question) return { evaluation: null, confidence: null, error: "Question not found" };

  const session = db
    .prepare("SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?")
    .get(sessionId, userId) as any;
  if (!session) return { evaluation: null, confidence: null, error: "Session not found" };

  // Upsert answer
  const existing = db
    .prepare("SELECT * FROM answers WHERE question_id = ?")
    .get(questionId) as any;
  let answerId: string;

  if (existing) {
    db.prepare(
      "UPDATE answers SET answer_text = ?, word_count = ? WHERE id = ?"
    ).run(answerText, answerText.trim().split(/\s+/).length, existing.id);
    answerId = existing.id;
    db.prepare("DELETE FROM evaluations WHERE answer_id = ?").run(answerId);
  } else {
    answerId = uuid();
    db.prepare(
      "INSERT INTO answers (id, question_id, answer_text, word_count) VALUES (?, ?, ?, ?)"
    ).run(answerId, questionId, answerText, answerText.trim().split(/\s+/).length);
  }

  db.prepare("UPDATE questions SET is_answered = 1 WHERE id = ?").run(questionId);

  // Confidence analysis from text
  const confidence = analyzeConfidence(answerText, durationSeconds || 30);

  // Evaluate with Groq
  let evaluation: any;
  try {
    evaluation = await groqGenerateJSON<any>(`
You are an expert interview evaluator. Evaluate the candidate's answer below.

Question: ${question.question_text}
Question type: ${question.question_type}
Key points to look for: ${question.expected_hints || "general quality"}
Candidate answer: ${answerText}
Confidence score from speech analysis: ${confidence.score}/100

Return ONLY this JSON with no extra text:
{
  "overall_score": <integer 0-100>,
  "technical_score": <integer 0-100 or null if not technical>,
  "relevance_score": <integer 0-100>,
  "communication_score": <integer 0-100>,
  "structure_score": <integer 0-100>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggested_answer": "<a good 3-5 sentence model answer>",
  "improvement_tips": ["<tip 1>", "<tip 2>"],
  "ai_feedback": "<2 sentences of direct constructive feedback>"
}
`);
  } catch (e: any) {
    console.error("[evaluate] Failed:", e.message);
    evaluation = {
      overall_score: 50,
      technical_score: null,
      relevance_score: 50,
      communication_score: 50,
      structure_score: 50,
      strengths: ["Answer was submitted"],
      weaknesses: ["Could not fully evaluate"],
      suggested_answer: "",
      improvement_tips: [],
      ai_feedback: "Evaluation service error. Your answer was saved.",
    };
  }

  const evalId = uuid();
  db.prepare(`
    INSERT INTO evaluations
      (id, answer_id, overall_score, technical_score, relevance_score,
       communication_score, structure_score, strengths, weaknesses,
       suggested_answer, improvement_tips, ai_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    evalId, answerId,
    evaluation.overall_score ?? 0,
    evaluation.technical_score ?? null,
    evaluation.relevance_score ?? 0,
    evaluation.communication_score ?? 0,
    evaluation.structure_score ?? 0,
    JSON.stringify(evaluation.strengths || []),
    JSON.stringify(evaluation.weaknesses || []),
    evaluation.suggested_answer || "",
    JSON.stringify(evaluation.improvement_tips || []),
    evaluation.ai_feedback || ""
  );

  // Auto-complete session
  const allQ = db
    .prepare("SELECT is_answered FROM questions WHERE session_id = ?")
    .all(sessionId) as any[];

  if (allQ.every((q: any) => q.is_answered === 1)) {
    const scores = db.prepare(`
      SELECT e.overall_score FROM evaluations e
      JOIN answers a ON a.id = e.answer_id
      JOIN questions q ON q.id = a.question_id
      WHERE q.session_id = ?
    `).all(sessionId) as any[];
    const avg =
      scores.reduce((s: number, r: any) => s + (r.overall_score || 0), 0) /
      scores.length;
    db.prepare(
      "UPDATE interview_sessions SET status='completed', completed_at=datetime('now'), overall_score=? WHERE id=?"
    ).run(avg, sessionId);
  }

  return { evaluation, confidence };
}