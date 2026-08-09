import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eastwestpk.com"),
  title: {
    default: "East & West Travel Services | Umrah, Hajj, Tours & Visa — Faisalabad",
    template: "%s | East & West Travel Services",
  },
  description:
    "IATA & DTS certified travel agency in Faisalabad since 2003. Umrah & Hajj packages, international tours, group air tickets, visa services, and travel insurance. 5,000+ travelers served.",
  keywords: [
    "Umrah packages Faisalabad", "Hajj packages Pakistan", "travel agency Faisalabad",
    "IATA certified travel agency", "Dubai tour package", "Thailand tour Pakistan",
    "group air tickets", "visa services Faisalabad", "East West Travel Services",
    "عمرہ پیکج فیصل آباد",
  ],
  authors: [{ name: "East & West Travel Services" }],
  creator: "East & West Travel Services",
  publisher: "East & West Travel Services",
  alternates: { canonical: "https://eastwestpk.com" },
  openGraph: {
    type: "website",
    url: "https://eastwestpk.com",
    siteName: "East & West Travel Services",
    title: "East & West Travel Services | Umrah, Hajj, Tours & Visa — Faisalabad",
    description: "IATA & DTS certified travel agency in Faisalabad since 2003. Umrah & Hajj packages, international tours, group tickets, visa services.",
    images: [{ url: "/assets/og-image.jpg", width: 1200, height: 630, alt: "East & West Travel Services" }],
    locale: "en_PK",
  },
  twitter: {
    card: "summary_large_image",
    title: "East & West Travel Services | Umrah, Tours & Visa",
    description: "IATA & DTS certified travel agency in Faisalabad. Umrah packages, international tours, visa services.",
    images: ["/assets/og-image.jpg"],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/assets/favicon-180.png",
    other: [{ rel: "icon", url: "/assets/favicon-512.png", sizes: "512x512" }],
  },
  verification: {
    // google: "YOUR_GOOGLE_SEARCH_CONSOLE_CODE", // add when you have it
  },
};

// JSON-LD structured data for Google
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TravelAgency",
      "@id": "https://eastwestpk.com/#organization",
      "name": "East & West Travel Services",
      "url": "https://eastwestpk.com",
      "logo": "https://eastwestpk.com/assets/logo.png",
      "image": "https://eastwestpk.com/assets/logo.png",
      "description": "IATA & DTS certified travel agency in Faisalabad, Pakistan since 2003.",
      "foundingDate": "2003",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Office #07, Ground Floor, Chaudhry Arcade, Regency Road, New Civil Lines",
        "addressLocality": "Faisalabad",
        "addressRegion": "Punjab",
        "postalCode": "38000",
        "addressCountry": "PK",
      },
      "geo": { "@type": "GeoCoordinates", "latitude": 31.4504, "longitude": 73.0885 },
      "telephone": "+92-333-651-5349",
      "email": "info@eastwestpk.com",
      "openingHours": "Mo-Sa 09:00-18:00",
      "priceRange": "PKR",
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "44" },
      "sameAs": [
        "https://www.facebook.com/eastwestpk",
        "https://www.google.com/maps/place/East+%26+West+Travel+Services",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://eastwestpk.com/#website",
      "url": "https://eastwestpk.com",
      "name": "East & West Travel Services",
      "publisher": { "@id": "https://eastwestpk.com/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://eastwestpk.com/umrah?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${cormorant.variable} ${jakarta.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
