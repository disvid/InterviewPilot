import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const ivSession = db.prepare("SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?").get(id, session.userId);
  if (!ivSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = db.prepare("SELECT * FROM questions WHERE session_id = ? ORDER BY order_index").all(id);
  return NextResponse.json({ questions });
}