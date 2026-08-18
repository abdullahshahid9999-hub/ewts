import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

const client = new Anthropic();

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("passport") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Detect MIME — never trust client blindly, but use it as primary signal
    let mimeType = (file.type || "image/jpeg").toLowerCase();
    // Normalise common aliases
    if (mimeType === "image/jpg") mimeType = "image/jpeg";
    if (!IMAGE_MIMES.has(mimeType) && mimeType !== "application/pdf") mimeType = "image/jpeg";

    const base64 = buffer.toString("base64");

    const prompt = `Extract passport/travel document data. Return ONLY valid JSON, no markdown, no extra text:
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
If any field is not visible or unclear, use null. Dates must be YYYY-MM-DD format.`;

    // Build content block based on MIME
    let contentBlock: Anthropic.MessageParam["content"];
    if (IMAGE_MIMES.has(mimeType)) {
      contentBlock = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
            data: base64,
          },
        },
        { type: "text", text: prompt },
      ];
    } else {
      // PDF — use document block
      contentBlock = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
        { type: "text", text: prompt },
      ];
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: contentBlock }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    let parsed: Record<string, string | null> = {};
    try {
      const clean = text.replace(/^```(?:json)?\n?|\n?```$/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      // Claude returned non-JSON — fail gracefully so frontend shows manual-fill
      return NextResponse.json({ error: "OCR failed. Please fill manually." }, { status: 422 });
    }

    // Upload to R2 — do this AFTER OCR so a storage failure never kills OCR
    let passportImageUrl: string | null = null;
    try {
      const r2Mime = IMAGE_MIMES.has(mimeType) ? mimeType : "image/jpeg";
      passportImageUrl = await uploadToR2({ buffer, contentType: r2Mime, folder: "visas" });
    } catch (uploadErr) {
      console.error("R2 upload failed (non-fatal):", uploadErr);
    }

    return NextResponse.json({ ...parsed, passportImageUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("OCR error:", msg);
    return NextResponse.json({ error: "OCR failed. Please fill manually." }, { status: 500 });
  }
}
