"use client";

import { useState } from "react";

type Props = {
  packageName: string;
  tier?: string | null;
  duration?: string | null;
  airline?: string | null;
  route?: string | null;
  depDate?: string | null;
  retDate?: string | null;
  departureCity?: string | null;
  flightType?: string | null;
  luggage?: string | null;
  transportType?: string | null;
  makkahHotel?: string | null;
  makkahHotelDistance?: string | null;
  makkahHotelNights?: number | null;
  makkahHotelImg?: string | null;
  madinahHotel?: string | null;
  madinahHotelDistance?: string | null;
  madinahHotelNights?: number | null;
  madinahHotelImg?: string | null;
  roomTypes?: { roomType: string; pricePerPersonPkr: number; pricePerChildWithBedPkr: number; pricePerInfantPkr: number }[];
  includes?: string | null;
};

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("load failed"));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lineH;
}

export default function ItineraryImageDownload({ packageName, tier, duration, airline, route, depDate, retDate, departureCity, flightType, luggage, transportType, makkahHotel, makkahHotelDistance, makkahHotelNights, makkahHotelImg, madinahHotel, madinahHotelDistance, madinahHotelNights, madinahHotelImg, roomTypes, includes }: Props) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const W = 1080, H = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // --- BACKGROUND ---
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#0c1f3a");
      bgGrad.addColorStop(0.4, "#132b52");
      bgGrad.addColorStop(1, "#0a1628");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // decorative arc
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 120;
      ctx.beginPath();
      ctx.arc(W / 2, -200, 800, 0, Math.PI);
      ctx.stroke();
      ctx.restore();

      // --- LOGO BAR ---
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, 0, W, 90);
      ctx.fillStyle = "#c9a227";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("East & West Travel Services", 48, 56);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "20px sans-serif";
      ctx.fillText("eastwestpk.com  •  +92 333 615 1349", 48, 80);

      // IATA badge
      ctx.fillStyle = "rgba(201,162,39,0.15)";
      roundRect(ctx, W - 170, 18, 128, 54, 8);
      ctx.fillStyle = "#c9a227";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("IATA MEMBER", W - 154, 42);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("Est. 2003", W - 148, 58);

      let y = 130;

      // --- TIER + PACKAGE NAME ---
      if (tier) {
        ctx.fillStyle = "#c9a227";
        ctx.font = "bold 20px sans-serif";
        const tierW = ctx.measureText(tier.toUpperCase()).width + 32;
        ctx.fillStyle = "rgba(201,162,39,0.2)";
        roundRect(ctx, 48, y, tierW, 34, 6);
        ctx.fillStyle = "#c9a227";
        ctx.fillText(tier.toUpperCase(), 64, y + 22);
        y += 50;
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 52px sans-serif";
      const nameLines = breakAt(packageName, 30);
      for (const line of nameLines) { ctx.fillText(line, 48, y); y += 62; }

      if (departureCity) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "24px sans-serif";
        ctx.fillText(`✈  Departing from ${departureCity}`, 48, y);
        y += 40;
      }

      y += 20;
      // divider
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(48, y, 80, 3);
      y += 24;

      // --- HOTEL IMAGES SIDE BY SIDE ---
      const hotelImgH = 320;
      const hotelImgW = (W - 96 - 20) / 2;
      let hotelImgY = y;
      let didHotel = false;

      for (const [hotel, dist, nights, imgUrl, city] of [
        [makkahHotel, makkahHotelDistance, makkahHotelNights, makkahHotelImg, "Makkah"],
        [madinahHotel, madinahHotelDistance, madinahHotelNights, madinahHotelImg, "Madinah"],
      ] as [string | null | undefined, string | null | undefined, number | null | undefined, string | null | undefined, string][]) {
        if (!hotel) continue;
        const hx = didHotel ? 48 + hotelImgW + 20 : 48;

        // image or placeholder
        if (imgUrl) {
          try {
            const hImg = await loadImg(imgUrl);
            ctx.save();
            roundRectClip(ctx, hx, hotelImgY, hotelImgW, hotelImgH, 16);
            ctx.drawImage(hImg, hx, hotelImgY, hotelImgW, hotelImgH);
            ctx.restore();
            // dark overlay
            const ov = ctx.createLinearGradient(hx, hotelImgY, hx, hotelImgY + hotelImgH);
            ov.addColorStop(0, "rgba(0,0,0,0)");
            ov.addColorStop(0.6, "rgba(0,0,0,0.55)");
            ov.addColorStop(1, "rgba(0,0,0,0.85)");
            ctx.fillStyle = ov;
            ctx.save(); roundRectClip(ctx, hx, hotelImgY, hotelImgW, hotelImgH, 16);
            ctx.fillRect(hx, hotelImgY, hotelImgW, hotelImgH);
            ctx.restore();
          } catch {
            ctx.fillStyle = "#1a2b45";
            ctx.save(); roundRectClip(ctx, hx, hotelImgY, hotelImgW, hotelImgH, 16);
            ctx.fillRect(hx, hotelImgY, hotelImgW, hotelImgH);
            ctx.restore();
          }
        } else {
          ctx.fillStyle = "#1a2b45";
          ctx.save(); roundRectClip(ctx, hx, hotelImgY, hotelImgW, hotelImgH, 16);
          ctx.fillRect(hx, hotelImgY, hotelImgW, hotelImgH);
          ctx.restore();
        }

        // city label
        ctx.fillStyle = "#c9a227";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(city.toUpperCase(), hx + 14, hotelImgY + 28);

        // hotel name at bottom
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px sans-serif";
        wrapText(ctx, hotel, hx + 14, hotelImgY + hotelImgH - 60, hotelImgW - 28, 22);

        if (dist || nights) {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "14px sans-serif";
          const detail = [dist ? `📍 ${dist}` : null, nights ? `🌙 ${nights}N` : null].filter(Boolean).join("  ");
          ctx.fillText(detail, hx + 14, hotelImgY + hotelImgH - 16);
        }

        didHotel = true;
      }

      if (didHotel) y = hotelImgY + hotelImgH + 32;

      // --- SPECS GRID ---
      const specs: [string, string][] = [];
      if (duration) specs.push(["📅 Duration", duration]);
      if (airline) specs.push(["✈️ Airline", airline]);
      if (route) specs.push(["🗺️ Route", route]);
      if (flightType) specs.push(["🛩️ Flight Type", flightType]);
      if (luggage) specs.push(["🧳 Luggage", luggage]);
      if (transportType) specs.push(["🚌 Transport", transportType]);
      if (depDate) specs.push(["🛫 Departure", depDate]);
      if (retDate) specs.push(["🛬 Return", retDate]);

      if (specs.length > 0) {
        ctx.fillStyle = "#c9a227";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("Package Details", 48, y); y += 36;

        const cols = 2;
        const cellW = (W - 96 - 20) / cols;
        const cellH = 68;
        specs.forEach(([label, val], i) => {
          const cx = 48 + (i % cols) * (cellW + 20);
          const cy = y + Math.floor(i / cols) * (cellH + 10);
          ctx.fillStyle = "rgba(255,255,255,0.07)";
          roundRect(ctx, cx, cy, cellW, cellH, 10);
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.font = "14px sans-serif";
          ctx.fillText(label, cx + 14, cy + 22);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 18px sans-serif";
          ctx.fillText(val.slice(0, 32), cx + 14, cy + 48);
        });
        y += Math.ceil(specs.length / cols) * (cellH + 10) + 32;
      }

      // --- PRICING TABLE ---
      if (roomTypes && roomTypes.length > 0) {
        ctx.fillStyle = "#c9a227";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("Pricing (Per Person)", 48, y); y += 36;

        const headers = ["Room Type", "Per Person", "Child (w/Bed)", "Infant"];
        const colWidths = [280, 200, 220, 180];
        const rowH = 52;

        // header
        ctx.fillStyle = "rgba(201,162,39,0.2)";
        ctx.fillRect(48, y, W - 96, rowH);
        let hx2 = 48;
        headers.forEach((h, i) => {
          ctx.fillStyle = "#c9a227";
          ctx.font = "bold 17px sans-serif";
          ctx.fillText(h, hx2 + 12, y + 32);
          hx2 += colWidths[i];
        });
        y += rowH;

        roomTypes.forEach((rt, ri) => {
          ctx.fillStyle = ri % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)";
          ctx.fillRect(48, y, W - 96, rowH);
          const vals = [
            rt.roomType,
            `PKR ${rt.pricePerPersonPkr.toLocaleString("en-PK")}`,
            `PKR ${rt.pricePerChildWithBedPkr.toLocaleString("en-PK")}`,
            `PKR ${rt.pricePerInfantPkr.toLocaleString("en-PK")}`,
          ];
          let vx = 48;
          vals.forEach((v, i) => {
            ctx.fillStyle = i === 0 ? "#ffffff" : "#a5d8ff";
            ctx.font = i === 0 ? "bold 17px sans-serif" : "17px sans-serif";
            ctx.fillText(v, vx + 12, y + 32);
            vx += colWidths[i];
          });
          y += rowH;
        });
        y += 32;
      }

      // --- INCLUDES ---
      if (includes) {
        const items = includes.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 8);
        if (items.length > 0) {
          ctx.fillStyle = "#c9a227";
          ctx.font = "bold 26px sans-serif";
          ctx.fillText("Included in Package", 48, y); y += 36;
          for (const item of items) {
            ctx.fillStyle = "#4ade80";
            ctx.font = "bold 18px sans-serif";
            ctx.fillText("✓", 48, y);
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.font = "18px sans-serif";
            ctx.fillText(item.slice(0, 58), 76, y);
            y += 30;
          }
          y += 16;
        }
      }

      // --- FOOTER ---
      const footerY = Math.max(y + 20, H - 100);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, footerY, W, H - footerY);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("East & West Travel Services  |  G-07, Chaudhry Arcade, New Civil Lines, Faisalabad", W / 2, footerY + 36);
      ctx.fillText("📞 +92 333 615 1349  |  📧 eastwestpk@hotmail.com  |  🌐 eastwestpk.com", W / 2, footerY + 62);
      ctx.fillStyle = "rgba(201,162,39,0.6)";
      ctx.font = "14px sans-serif";
      ctx.fillText("Prices are per person. Subject to change without notice. T&C apply.", W / 2, footerY + 86);
      ctx.textAlign = "left";

      // download
      const url = canvas.toDataURL("image/jpeg", 0.92);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${packageName.replace(/\s+/g, "-")}-itinerary.jpg`;
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition"
      style={{ background: "var(--gold)", color: "#000", opacity: loading ? 0.7 : 1 }}
    >
      {loading ? (
        <><span className="animate-spin">⏳</span> Generating…</>
      ) : (
        <><span>📥</span> Download Itinerary Image</>
      )}
    </button>
  );
}

function breakAt(text: string, maxLen: number): string[] {
  const words = text.split(" "); const lines: string[] = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxLen && cur) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath(); ctx.fill();
}

function roundRectClip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath(); ctx.clip();
}
