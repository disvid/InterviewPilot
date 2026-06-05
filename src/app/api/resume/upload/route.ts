import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { extractPdfText } from "@/lib/pdf";
import { groqGenerateJSON } from "@/lib/ai";   
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const rawText = await extractPdfText(buffer);

    if (!rawText || rawText.length < 50) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    const parsed = await groqGenerateJSON<any>(`
You are an expert resume parser. Parse this resume and return **ONLY** valid JSON with this exact structure:

{
  "skills": [{"skill_name": "string", "category": "string", "proficiency_level": "beginner|intermediate|advanced|expert"}],
  "experience": [{"company": "string", "role": "string", "start_date": "string", "end_date": "string or null", "description": "string"}],
  "education": [{"degree": "string", "institution": "string", "graduation_year": number or null}],
  "projects": [{"name": "string", "description": "string", "technologies": ["string"]}],
  "summary": "string (2-3 sentence professional summary)",
  "total_experience_years": number
}

Resume text:
${rawText.slice(0, 8000)}
`);

    const db = getDb();

    db.prepare("UPDATE resumes SET is_active = 0 WHERE user_id = ?").run(session.userId);

    const id = uuid();

    db.prepare(`
      INSERT INTO resumes (
        id, user_id, filename, raw_text, parsed_skills, parsed_experience, 
        parsed_education, parsed_projects, summary, experience_years, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      session.userId,
      file.name,
      rawText.slice(0, 50000),
      JSON.stringify(parsed.skills || []),
      JSON.stringify(parsed.experience || []),
      JSON.stringify(parsed.education || []),
      JSON.stringify(parsed.projects || []),
      parsed.summary || "",
      parsed.total_experience_years || 0
    );

    const resume = db.prepare("SELECT * FROM resumes WHERE id = ?").get(id);

    return NextResponse.json({ resume });

  } catch (error: any) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to parse resume. Please try again." 
    }, { status: 500 });
  }
}