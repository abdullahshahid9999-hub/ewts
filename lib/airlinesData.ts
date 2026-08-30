// Major airlines with IATA codes and logo URLs (via airline logo APIs — no auth needed)
export type Airline = { iata: string; name: string; logo: string };

export const AIRLINES: Airline[] = [
  { iata: "PK", name: "Pakistan International Airlines", logo: "https://images.kiwi.com/airlines/64/PK.png" },
  { iata: "PA", name: "Pakistan Airline (Air Arabia Pakistan)", logo: "https://images.kiwi.com/airlines/64/PA.png" },
  { iata: "ER", name: "Serene Air", logo: "https://images.kiwi.com/airlines/64/ER.png" },
  { iata: "AW", name: "Air Arabia Pakistan", logo: "https://images.kiwi.com/airlines/64/G9.png" },
  { iata: "G9", name: "Air Arabia", logo: "https://images.kiwi.com/airlines/64/G9.png" },
  { iata: "EK", name: "Emirates", logo: "https://images.kiwi.com/airlines/64/EK.png" },
  { iata: "QR", name: "Qatar Airways", logo: "https://images.kiwi.com/airlines/64/QR.png" },
  { iata: "EY", name: "Etihad Airways", logo: "https://images.kiwi.com/airlines/64/EY.png" },
  { iata: "FZ", name: "flydubai", logo: "https://images.kiwi.com/airlines/64/FZ.png" },
  { iata: "SV", name: "Saudia", logo: "https://images.kiwi.com/airlines/64/SV.png" },
  { iata: "WY", name: "Oman Air", logo: "https://images.kiwi.com/airlines/64/WY.png" },
  { iata: "GF", name: "Gulf Air", logo: "https://images.kiwi.com/airlines/64/GF.png" },
  { iata: "KU", name: "Kuwait Airways", logo: "https://images.kiwi.com/airlines/64/KU.png" },
  { iata: "TK", name: "Turkish Airlines", logo: "https://images.kiwi.com/airlines/64/TK.png" },
  { iata: "LH", name: "Lufthansa", logo: "https://images.kiwi.com/airlines/64/LH.png" },
  { iata: "BA", name: "British Airways", logo: "https://images.kiwi.com/airlines/64/BA.png" },
  { iata: "AI", name: "Air India", logo: "https://images.kiwi.com/airlines/64/AI.png" },
  { iata: "UL", name: "SriLankan Airlines", logo: "https://images.kiwi.com/airlines/64/UL.png" },
  { iata: "MH", name: "Malaysia Airlines", logo: "https://images.kiwi.com/airlines/64/MH.png" },
  { iata: "SQ", name: "Singapore Airlines", logo: "https://images.kiwi.com/airlines/64/SQ.png" },
  { iata: "CX", name: "Cathay Pacific", logo: "https://images.kiwi.com/airlines/64/CX.png" },
  { iata: "MS", name: "EgyptAir", logo: "https://images.kiwi.com/airlines/64/MS.png" },
  { iata: "ET", name: "Ethiopian Airlines", logo: "https://images.kiwi.com/airlines/64/ET.png" },
];

export function getAirlineByIata(iata: string): Airline | null {
  return AIRLINES.find(a => a.iata.toUpperCase() === iata.toUpperCase()) ?? null;
}

// Detect airline IATA from flight number e.g. "PK741" → "PK"
export function airlineFromFlightNo(flightNo: string): Airline | null {
  const match = flightNo.trim().toUpperCase().match(/^([A-Z]{2,3})/);
  if (!match) return null;
  return getAirlineByIata(match[1]);
}

// Generic logo URL for any IATA (kiwi CDN works for most airlines)
export function airlineLogoUrl(iata: string): string {
  return `https://images.kiwi.com/airlines/64/${iata.toUpperCase()}.png`;
}
