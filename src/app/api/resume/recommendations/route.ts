import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { groqGenerateJSON } from "@/lib/ai";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const resume = db
      .prepare("SELECT * FROM resumes WHERE user_id = ? AND is_active = 1")
      .get(session.userId) as any;

    if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 404 });

    const skills = resume.parsed_skills ? JSON.parse(resume.parsed_skills) : [];
    const experience = resume.parsed_experience ? JSON.parse(resume.parsed_experience) : [];
    const projects = resume.parsed_projects ? JSON.parse(resume.parsed_projects) : [];
    const education = resume.parsed_education ? JSON.parse(resume.parsed_education) : [];

    const recommendations = await groqGenerateJSON<any>(`
You are an expert resume coach and career advisor. Analyze this resume and give specific, actionable recommendations.

Resume Summary: ${resume.summary || "Not provided"}
Experience Years: ${resume.experience_years || 0}

Skills (${skills.length}): ${skills.map((s: any) => s.skill_name).join(", ")}

Experience:
${experience.map((e: any) => `- ${e.role} at ${e.company}: ${e.description?.slice(0, 100)}`).join("\n")}

Projects:
${projects.map((p: any) => `- ${p.name}: ${p.description?.slice(0, 100)}`).join("\n")}

Education:
${education.map((e: any) => `- ${e.degree} from ${e.institution}`).join("\n")}

Return ONLY this JSON with no extra text:
{
  "overall_score": <integer 0-100, honest assessment>,
  "summary_feedback": "<2-3 sentences on overall resume quality>",
  "strengths": [
    {"title": "<strength>", "detail": "<specific detail>"}
  ],
  "improvements": [
    {
      "priority": "<high|medium|low>",
      "section": "<Skills|Experience|Projects|Summary|Format|Keywords>",
      "issue": "<specific problem>",
      "fix": "<exactly what to do>",
      "example": "<concrete example if applicable>"
    }
  ],
  "missing_sections": ["<section that should be added>"],
  "keyword_suggestions": ["<keyword to add for ATS>"],
  "action_verbs_to_add": ["<strong action verb>"],
  "ats_score": <integer 0-100>,
  "ats_tips": ["<specific ATS optimization tip>"]
}

Be specific. Reference actual content from the resume. Give at least 5 improvements.
`);

    return NextResponse.json({ recommendations, resume_filename: resume.filename });
  } catch (err: any) {
    console.error("[resume/recommendations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}