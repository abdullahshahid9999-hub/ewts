import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

// Public, unauthenticated endpoint — the contact form has no login. Rate
// limit by IP so it can't be used to spam the business's inbox, and keep
// validation simple/generous rather than rejecting legitimate messages.
const NOTIFY_EMAIL = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "eastwestpk@hotmail.com";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`contact-form:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !message || (!email && !phone)) {
    return NextResponse.json(
      { error: "Name, message, and at least one contact method (email or phone) are required." },
      { status: 400 }
    );
  }

  try {
    await sendEmail({
      to: NOTIFY_EMAIL,
      subject: `New Contact Form Message — ${name}`,
      replyTo: email || undefined,
      html: `
        <h2>New message from the website contact form</h2>
        <p><strong>Name:</strong> ${name}</p>
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Contact form email failed:", e);
    return NextResponse.json({ error: "Could not send message. Please try WhatsApp instead." }, { status: 500 });
  }
}
