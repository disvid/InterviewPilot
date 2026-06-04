import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { groqTextToSpeech } from "@/lib/ai";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const truncatedText = text.slice(0, 500);
    const audioBuffer = await groqTextToSpeech(truncatedText);

    // ✅ Fixed: Convert Buffer to Uint8Array for NextResponse
    const audioArray = new Uint8Array(audioBuffer);

    return new NextResponse(audioArray, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioArray.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[TTS] Error:", err.message);
    return NextResponse.json({ 
      error: "Text-to-speech service failed. Using browser fallback." 
    }, { status: 500 });
  }
}