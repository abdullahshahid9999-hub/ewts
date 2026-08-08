import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = { title: "Refund Policy | East & West Travel Services" };

const SERVICES = [
  {
    service: "Umrah Packages",
    rows: [
      { condition: "Cancellation 30+ days before departure", refund: "Full refund minus processing fee (PKR 5,000)" },
      { condition: "Cancellation 15–29 days before departure", refund: "50% refund" },
      { condition: "Cancellation 7–14 days before departure", refund: "25% refund" },
      { condition: "Cancellation less than 7 days / No-show", refund: "No refund" },
    ],
  },
  {
    service: "Tour Packages",
    rows: [
      { condition: "Cancellation 21+ days before departure", refund: "Full refund minus processing fee (PKR 3,000)" },
      { condition: "Cancellation 10–20 days before departure", refund: "50% refund" },
      { condition: "Cancellation less than 10 days / No-show", refund: "No refund" },
    ],
  },
  {
    service: "Group Flight Tickets",
    rows: [
      { condition: "Refundable ticket — cancelled 48+ hrs before departure", refund: "Refund minus airline penalty + PKR 2,000 service fee" },
      { condition: "Non-refundable ticket", refund: "No refund (name change may be possible — charges apply)" },
      { condition: "Flight cancelled by airline", refund: "Full refund or rebooking per airline policy" },
    ],
  },
  {
    service: "Visa Services",
    rows: [
      { condition: "Visa approved", refund: "No refund" },
      { condition: "Visa rejected by embassy", refund: "No refund on service fee; government fee refund per embassy policy" },
      { condition: "Application withdrawn before submission", refund: "Partial refund minus documentation fee (PKR 2,000)" },
    ],
  },
  {
    service: "Travel Insurance",
    rows: [
      { condition: "Cancelled within 24 hours of purchase (no travel yet)", refund: "Full refund" },
      { condition: "Cancelled after 24 hours", refund: "No refund (policy already active)" },
    ],
  },
];

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <section className="bg-[var(--lp-ink)] text-white text-center px-6 pt-16 pb-12">
        <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-4">Legal</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">Refund Policy</h1>
        <p className="text-white/50 text-sm">Last updated: August 2026</p>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-muted text-sm mb-10">
          We understand plans change. Below is our refund policy per service type.
          All refund requests must be submitted in writing to <a href="mailto:eastwestpk@hotmail.com" className="text-[var(--lp-brass)] hover:underline">eastwestpk@hotmail.com</a> or via WhatsApp.
          Refunds are processed within <strong>7–21 working days</strong> via the original payment method.
        </p>

        <div className="space-y-10">
          {SERVICES.map((svc) => (
            <div key={svc.service}>
              <h2 className="font-semibold text-lg mb-3 text-text">{svc.service}</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-text">Condition</th>
                      <th className="text-left px-4 py-3 font-semibold text-text">Refund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {svc.rows.map((r, i) => (
                      <tr key={i} className={i < svc.rows.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-4 py-3 text-muted">{r.condition}</td>
                        <td className="px-4 py-3 font-medium text-text">{r.refund}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-5 bg-surface rounded-xl border border-border text-sm text-muted space-y-2">
          <p><strong className="text-text">Force Majeure:</strong> No refunds are guaranteed for cancellations due to war, natural disasters, pandemics, or government travel bans, though we will do our best to recover costs from suppliers.</p>
          <p><strong className="text-text">Questions?</strong> <Link href="/contact" className="text-[var(--lp-brass)] hover:underline">Contact us</Link> — we are always willing to discuss your situation.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}
