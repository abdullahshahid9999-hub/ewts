import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = { title: "Terms & Conditions | East & West Travel Services" };

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By using our website (eastwestpk.com) or booking any service through East & West Travel Services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.`,
  },
  {
    title: "2. Services Offered",
    body: `East & West Travel Services provides travel-related services including Umrah packages, tour packages, group flight tickets, travel insurance, and visa assistance. All services are subject to availability and confirmation.`,
  },
  {
    title: "3. Bookings & Confirmation",
    body: `A booking is only confirmed upon receipt of full payment or an approved deposit, and after we issue a written confirmation via WhatsApp or email. Seat holds are temporary (up to 2 hours) and do not guarantee a booking until confirmed by our team.`,
  },
  {
    title: "4. Pricing",
    body: `All prices are displayed in Pakistani Rupees (PKR) and are subject to change without prior notice due to airline, hotel, or government policy changes. The price at the time of confirmation and payment is the binding price.`,
  },
  {
    title: "5. Payments",
    body: `We accept bank transfers and cash payments at our office. Online payment processing is not currently available. Proof of payment must be submitted for verification. East & West Travel Services is not responsible for payments made to unauthorised accounts.`,
  },
  {
    title: "6. Cancellations & Refunds",
    body: `Cancellation policies vary by service type. Please refer to our Refund Policy page for full details. Refunds are processed within 7–21 working days depending on the service. Some services (e.g. visas, airline tickets) may be non-refundable once processed.`,
  },
  {
    title: "7. Travel Documents",
    body: `Customers are solely responsible for ensuring their travel documents (passport, visa, permits) are valid. East & West Travel Services assists with visa applications but cannot guarantee approval. Rejection of a visa application does not entitle a refund of service fees.`,
  },
  {
    title: "8. Insurance",
    body: `Travel insurance purchased through us is underwritten by the respective insurance company. Claims are handled directly by the insurer. We act as facilitators only and bear no liability for claim outcomes.`,
  },
  {
    title: "9. Liability",
    body: `East & West Travel Services acts as an agent for airlines, hotels, and other suppliers. We are not liable for delays, cancellations, force majeure events, acts of God, government actions, strikes, or any loss/damage caused by third-party suppliers.`,
  },
  {
    title: "10. Privacy",
    body: `Your personal information is collected and used solely to process your bookings and communicate with you. We do not sell your data to third parties. Please see our Privacy Policy for full details.`,
  },
  {
    title: "11. Governing Law",
    body: `These terms are governed by the laws of Pakistan. Any disputes shall be subject to the jurisdiction of courts in Faisalabad, Punjab, Pakistan.`,
  },
  {
    title: "12. Changes to Terms",
    body: `We reserve the right to update these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <section className="bg-[var(--lp-ink)] text-white text-center px-6 pt-16 pb-12">
        <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-4">Legal</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">Terms &amp; Conditions</h1>
        <p className="text-white/50 text-sm">Last updated: August 2026</p>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-muted text-sm mb-10">
          Please read these terms carefully before using our services. If you have questions, <Link href="/contact" className="text-[var(--lp-brass)] hover:underline">contact us</Link>.
        </p>
        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-semibold text-lg mb-2 text-text">{s.title}</h2>
              <p className="text-muted leading-relaxed text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
