import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("passport") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    // Upload to R2
    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `passports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const imageUrl = await uploadToR2(buffer, key, mimeType);

    // OCR with Claude Vision
    const base64 = buffer.toString("base64");
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64 },
          },
          {
            type: "text",
            text: `Extract passport/travel document data. Return ONLY valid JSON, no markdown:
{
  "givenName": "",
  "surname": "",
  "passportNo": "",
  "dateOfBirth": "YYYY-MM-DD or null",
  "dateOfIssue": "YYYY-MM-DD or null",
  "dateOfExpiry": "YYYY-MM-DD or null",
  "gender": "M or F or null",
  "nationality": "country name or null",
  "issuingCountry": "country name or null"
}
If any field is not visible or unclear, use null. Dates must be YYYY-MM-DD format.`,
          },
        ],
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    let parsed: Record<string, string | null> = {};
    try {
      parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      parsed = {};
    }

    return NextResponse.json({ ...parsed, passportImageUrl: imageUrl });
  } catch (e) {
    console.error("OCR error:", e);
    return NextResponse.json({ error: "OCR failed. Please fill manually." }, { status: 500 });
  }
}
