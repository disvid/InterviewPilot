import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateAIJSON } from "@/lib/ai";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { interview_type, job_role, difficulty, total_questions } = await req.json();
  const db = getDb();

  const resume = db.prepare("SELECT * FROM resumes WHERE user_id = ? AND is_active = 1").get(session.userId) as any;
  const skills = resume?.parsed_skills ? JSON.parse(resume.parsed_skills).slice(0, 15).map((s: any) => s.skill_name).join(", ") : "general software engineering";
  const experience = resume?.parsed_experience ? JSON.parse(resume.parsed_experience).slice(0, 3).map((e: any) => `${e.role} at ${e.company}`).join(", ") : "not provided";
  const projects = resume?.parsed_projects ? JSON.parse(resume.parsed_projects).slice(0, 3).map((p: any) => p.name).join(", ") : "not provided";

  const numQ = total_questions || 8;

  const questions = await generateAIJSON<any[]>(`
You are an expert technical interviewer. Generate exactly ${numQ} interview questions.

Candidate skills: ${skills}
Experience: ${experience}
Projects: ${projects}
Interview type: ${interview_type}
Target role: ${job_role || "Software Engineer"}
Difficulty: ${difficulty || "medium"}

Return a JSON array of exactly ${numQ} objects:
[{
  "question_text": "string (full question)",
  "question_type": "technical|behavioral|hr|system_design",
  "skill_tags": ["string"],
  "expected_hints": "string (2-3 key points for a good answer)"
}]

Guidelines: Mix question types based on interview_type. Refer to candidate's specific skills/projects where relevant. For behavioral, use STAR format prompts.
`);

  const sessionId = uuid();
  db.prepare(`INSERT INTO interview_sessions (id, user_id, resume_id, interview_type, job_role, difficulty, total_questions, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress')`)
    .run(sessionId, session.userId, resume?.id || null, interview_type, job_role || null, difficulty || "medium", numQ);

  const insertQ = db.prepare(`INSERT INTO questions (id, session_id, question_text, question_type, skill_tags, order_index, expected_hints)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    insertQ.run(uuid(), sessionId, q.question_text, q.question_type || "technical",
      JSON.stringify(q.skill_tags || []), i, q.expected_hints || "");
  }

  db.prepare("UPDATE interview_sessions SET started_at = datetime('now') WHERE id = ?").run(sessionId);

  return NextResponse.json({ session_id: sessionId });
}