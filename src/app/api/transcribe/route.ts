import { NextResponse } from "next/server";
import OpenAI from "openai";

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Get uploaded file from request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Send file to Whisper API and request segment timestamps
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    // Return transcript text and timestamps if the Whisper response provides them
    return NextResponse.json({
      text: transcription.text,
      segments: (transcription as any).segments ?? null,
    });

  } catch (error: any) {
  console.error("FULL ERROR:", error);

  return NextResponse.json(
    {
      error: error?.message || "Failed to transcribe audio",
    },
    { status: 500 }
  );
}
}
