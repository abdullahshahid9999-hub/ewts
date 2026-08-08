import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Disclaimer | East & West Travel Services" };

export default function DisclaimerPage() {
  return (
    <>
      <Navbar />
      <section className="bg-[var(--lp-ink)] text-white text-center px-6 pt-16 pb-12">
        <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-4">Legal</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">Disclaimer</h1>
        <p className="text-white/50 text-sm">Last updated: August 2026</p>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8 text-sm text-muted leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-2 text-text">General Information</h2>
          <p>The information on eastwestpk.com is provided for general informational purposes only. While we strive to keep all information accurate and up to date, we make no warranties of any kind — express or implied — about the completeness, accuracy, reliability, or suitability of the information for any purpose.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2 text-text">Visa & Immigration Information</h2>
          <p>Visa requirements, processing times, and embassy policies change frequently. Information on our website is provided as a general guide only and should not be treated as official immigration advice. Always verify with the relevant embassy or consulate before making travel arrangements.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2 text-text">Prices & Availability</h2>
          <p>All prices displayed on this website are indicative and subject to change without notice. Final prices are confirmed at the time of booking. Availability of packages, seats, and hotel rooms is not guaranteed until a booking confirmation is issued by our team.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2 text-text">Third-Party Services</h2>
          <p>East & West Travel Services acts as an agent for airlines, hotels, visa agencies, and insurance companies. We are not responsible for any acts, errors, omissions, representations, or warranties of these third-party suppliers, or for any loss or damages arising from their services.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2 text-text">Umrah & Religious Services</h2>
          <p>Umrah packages are subject to Saudi government quotas, Ministry of Hajj regulations, and airline scheduling. We facilitate bookings in good faith but cannot guarantee specific hotel proximity, room allocation, or group size. Any changes imposed by Saudi authorities are beyond our control.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2 text-text">External Links</h2>
          <p>Our website may contain links to external sites. These links are provided for convenience only. East & West Travel Services has no control over the content of external sites and accepts no responsibility for them.</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2 text-text">Contact</h2>
          <p>If you have concerns about any content on our website, please email us at <a href="mailto:eastwestpk@hotmail.com" className="text-[var(--lp-brass)] hover:underline">eastwestpk@hotmail.com</a>.</p>
        </div>
      </div>
      <Footer />
    </>
  );
}
