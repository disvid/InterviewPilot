import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateAIJSON } from "@/lib/ai";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_role } = await req.json();
  if (!target_role) return NextResponse.json({ error: "Target role required" }, { status: 400 });

  const db = getDb();
  const resume = db.prepare("SELECT * FROM resumes WHERE user_id = ? AND is_active = 1").get(session.userId) as any;
  const currentSkills = resume?.parsed_skills ? JSON.parse(resume.parsed_skills).map((s: any) => s.skill_name) : [];

  const result = await generateAIJSON<any>(`
You are a senior career coach. Create a focused learning roadmap.

Target role: ${target_role}
Current skills: ${currentSkills.join(", ") || "not provided"}

Return JSON:
{
  "missing_skills": ["string (top 8 skills to acquire)"],
  "readiness_score": number (0-100, honest assessment),
  "estimated_weeks": number,
  "weekly_plan": [
    {
      "week": number,
      "title": "string",
      "tasks": ["string (3-4 specific tasks)"],
      "resources": [{"title": "string", "url": "string", "type": "course|article|practice"}]
    }
  ]
}

Generate 6-8 weeks of weekly_plan. Be specific and realistic.
`);

  const id = uuid();
  db.prepare(`INSERT INTO roadmaps (id, user_id, target_role, missing_skills, readiness_score, weekly_plan, estimated_weeks) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, session.userId, target_role,
      JSON.stringify(result.missing_skills || []),
      result.readiness_score || 0,
      JSON.stringify(result.weekly_plan || []),
      result.estimated_weeks || 8);

  const roadmap = db.prepare("SELECT * FROM roadmaps WHERE id = ?").get(id);
  return NextResponse.json({ roadmap });
}