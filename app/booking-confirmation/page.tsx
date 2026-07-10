import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; package?: string; roomType?: string; total?: string }>;
}) {
  const params = await searchParams;
  const { ref, package: packageName, roomType, total } = params;

  if (!ref) {
    return (
      <>
        <Navbar />
        <section className="max-w-lg mx-auto px-6 py-24 text-center">
          <p className="text-4xl mb-4">🎫</p>
          <h1 className="font-display text-2xl font-semibold mb-3">No booking reference found</h1>
          <p className="text-muted text-sm mb-6">
            This page shows a confirmation after completing a booking — looks like you landed
            here directly.
          </p>
          <Link href="/umrah" className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors">
            Browse Packages
          </Link>
        </section>
        <Footer />
      </>
    );
  }

  const whatsappMessage = `Assalam o Alaikum! I just submitted booking ${ref}${
    packageName ? ` for "${packageName}"` : ""
  } and wanted to follow up.`;

  return (
    <>
      <Navbar />
      <section className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-5xl mb-5">✅</p>
        <h1 className="font-display text-3xl font-semibold mb-3">Booking Request Received!</h1>
        <p className="text-muted text-sm mb-8">
          Reference: <span className="font-semibold text-[var(--text)]">{ref}</span>
        </p>

        <div className="bg-white border border-border rounded-2xl p-6 text-left mb-8">
          {packageName && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Package</span>
              <span className="font-medium">{packageName}</span>
            </div>
          )}
          {roomType && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Room Type</span>
              <span className="font-medium">{roomType}</span>
            </div>
          )}
          {total && (
            <div className="flex justify-between text-sm pt-2 border-t border-border mt-2">
              <span className="text-muted">Total</span>
              <span className="font-display font-semibold text-gold">Rs. {Number(total).toLocaleString()}</span>
            </div>
          )}
        </div>

        <p className="bg-[var(--surface)] border border-border rounded-xl p-4 text-sm mb-8">
          <strong>No payment has been taken yet.</strong> Our team will contact you on
          WhatsApp/phone within 24 hours to confirm details and discuss payment.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={waLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
          >
            Message Us on WhatsApp
          </a>
          <Link href="/" className="border border-border hover:border-gold px-6 py-3 rounded-lg font-semibold transition-colors">
            Back to Home
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
