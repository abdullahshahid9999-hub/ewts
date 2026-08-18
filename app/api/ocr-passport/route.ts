// OCR is now handled client-side via Tesseract.js in lib/passportScan.ts
// This route is kept as a stub to avoid 404s from any cached requests
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST() {
  return NextResponse.json({ error: "Use client-side OCR." }, { status: 410 });
}
