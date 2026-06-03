import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    const token = await createToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}