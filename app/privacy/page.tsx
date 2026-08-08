import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = { title: "Privacy Policy | East & West Travel Services" };

const SECTIONS = [
  { title: "1. Information We Collect", body: `We collect information you provide directly: your full name, CNIC/passport number, date of birth, phone number, email address, and travel details. This is collected when you make a booking, fill a form, or contact us via WhatsApp or email.` },
  { title: "2. How We Use Your Information", body: `We use your information to process bookings, issue tickets and visas, send booking confirmations, respond to your queries, and comply with airline, government, and legal requirements. We do not use your data for marketing without consent.` },
  { title: "3. Data Sharing", body: `Your data is shared only with third parties necessary to complete your booking — airlines, hotels, visa authorities, and insurance companies. We do not sell, rent, or trade your personal information to any other party.` },
  { title: "4. Passport & CNIC Data", body: `Passport and CNIC copies submitted for visa or ticketing purposes are stored securely and used only for the stated purpose. These documents are not shared beyond the relevant government or airline authority.` },
  { title: "5. Data Security", body: `We use industry-standard security measures including encrypted data transmission (HTTPS), secure servers, and access controls. However, no system is 100% secure — please notify us immediately at eastwestpk@hotmail.com if you suspect any unauthorised use of your data.` },
  { title: "6. Cookies", body: `Our website uses essential cookies only — to maintain your session and remember preferences. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, though some site features may not function correctly.` },
  { title: "7. Data Retention", body: `We retain your booking records for a minimum of 5 years as required by Pakistani tax and business law. After this period, data is securely deleted. You may request deletion of non-essential data at any time.` },
  { title: "8. Your Rights", body: `You have the right to access, correct, or request deletion of your personal data held by us. To exercise these rights, contact us at eastwestpk@hotmail.com. We will respond within 7 working days.` },
  { title: "9. Third-Party Links", body: `Our website may link to third-party websites (airlines, embassies, insurance portals). We are not responsible for the privacy practices of those sites. Please review their privacy policies independently.` },
  { title: "10. Changes to This Policy", body: `We may update this policy periodically. The updated version will be posted on this page with a revised date. Continued use of our services constitutes acceptance.` },
  { title: "11. Contact", body: `For privacy-related queries, contact East & West Travel Services at: G-07 Chaudhry Arcade, New Civil Lines, Faisalabad | eastwestpk@hotmail.com | +92 333 651 5349` },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <section className="bg-[var(--lp-ink)] text-white text-center px-6 pt-16 pb-12">
        <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-4">Legal</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">Privacy Policy</h1>
        <p className="text-white/50 text-sm">Last updated: August 2026</p>
      </section>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-muted text-sm mb-10">
          East &amp; West Travel Services respects your privacy. This policy explains how we collect, use, and protect your personal data.
          Questions? <Link href="/contact" className="text-[var(--lp-brass)] hover:underline">Contact us</Link>.
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
