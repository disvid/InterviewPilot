import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password, full_name } = await req.json();
    if (!email || !username || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 chars" }, { status: 400 });

    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ? OR username = ?").get(email, username);
    if (existing) return NextResponse.json({ error: "Email or username already taken" }, { status: 400 });

    const id = uuid();
    const hash = await hashPassword(password);
    db.prepare("INSERT INTO users (id, email, username, password_hash, full_name) VALUES (?, ?, ?, ?, ?)").run(id, email, username, hash, full_name || null);

    const token = await createToken({ userId: id, email });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}