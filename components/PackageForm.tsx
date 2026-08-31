"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import PackageRoomTypesManager from "@/components/PackageRoomTypesManager";
import FlightSectorsEditor, { Sector, defaultSectors } from "@/components/FlightSectorsEditor";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

// ─── Types ────────────────────────────────────────────────────────────────────
type ImgMode = "upload" | "url";
type ItineraryStep = { title: string; details: string; images: string };
type LibraryStep = { id: string; title: string; description: string | null; tag: string };

type FixedRoomKey = "quad" | "triple" | "double" | "sharing";
type RoomPrices = { perPerson: string; perChild: string; perInfant: string };
type FixedRooms = Record<FixedRoomKey, RoomPrices>;
const FIXED_ROOM_META: Record<FixedRoomKey, { label: string; maxAdults: number; maxInfants: number }> = {
  quad:    { label: "Quad Room (4 pax)",   maxAdults: 4, maxInfants: 1 },
  triple:  { label: "Triple Room (3 pax)", maxAdults: 3, maxInfants: 1 },
  double:  { label: "Double Room (2 pax)", maxAdults: 2, maxInfants: 1 },
  sharing: { label: "Sharing (6+ pax)",    maxAdults: 6, maxInfants: 0 },
};
const emptyRoomPrices = (): RoomPrices => ({ perPerson: "", perChild: "0", perInfant: "0" });
const emptyFixedRooms = (): FixedRooms => ({
  quad: emptyRoomPrices(), triple: emptyRoomPrices(),
  double: emptyRoomPrices(), sharing: emptyRoomPrices(),
});

type RoomType = {
  id: string; roomType: string; pricePerPersonPkr: number; pricePerInfantPkr: number;
  pricePerChildPkr: number; pricePerChildWithBedPkr: number; pricePerChildWithoutBedPkr: number;
  maxAdults: number; maxInfants: number; minAdultsRequired: number | null; availableSlots: number | null;
};

export type ExistingPackage = {
  id: string; category: string; name: string; slug: string | null;
  duration: string | null; depDate: string | null; retDate: string | null;
  airline: string | null; route: string | null; hotels: string | null;
  price: string | null; destination: string | null; departureCity: string | null;
  tier: string | null; includes: string | null; excludes: string | null;
  featured: boolean; status: string; copyEnabled: boolean; groupTicketEnabled: boolean; visaEnabled: boolean;
  cardVersion: string | null; imageUrl: string | null; galleryUrls: string[] | null;
  makkahHotel: string | null; makkahHotelDistance: string | null; makkahHotelNights: number | null; makkahHotelImg: string | null;
  madinahHotel: string | null; madinahHotelDistance: string | null; madinahHotelNights: number | null; madinahHotelImg: string | null;
  flightType: string | null; luggage: string | null; transportType: string | null; totalSeats: number | null;
  flightSectors: unknown; itinerary: unknown;
  roomTypes: RoomType[];
};

function genSlug() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function formatPkr(n: number) { return `PKR ${n.toLocaleString("en-PK")}`; }

// Auto-derive from flight sectors
function deriveFromSectors(sectors: Sector[]) {
  const dep = sectors.find(s => s.type === "Departure");
  const arr = sectors.find(s => s.type === "Arrival");
  const vias = sectors.filter(s => s.type === "Via");
  const airlines = [...new Set(sectors.map(s => s.airlineName || s.airlineIata).filter(Boolean))];
  const route = [dep?.fromIata, ...vias.map(v => v.toIata || v.fromIata), arr?.toIata || arr?.fromIata].filter(Boolean).join("–");
  let duration = "";
  if (dep?.date && arr?.date) {
    const d1 = new Date(dep.date), d2 = new Date(arr.date);
    const days = Math.round((d2.getTime() - d1.getTime()) / 86400000);
    if (days > 0) duration = `${days} Day${days !== 1 ? "s" : ""} / ${days - 1} Night${days - 1 !== 1 ? "s" : ""}`;
  }
  return {
    depDate: dep?.date ?? "",
    retDate: arr?.date ?? "",
    airline: airlines.join(", "),
    route,
    destination: arr?.toIata || arr?.fromIata || dep?.toIata || "",
    departureCity: dep?.fromIata || "",
    duration,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PackageForm({ existing }: { existing?: ExistingPackage }) {
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const isEdit = !!existing;

  // Step 1: version/category selection (only for new)
  const [step, setStep] = useState<"select" | "form">(isEdit ? "form" : "select");
  const [selectedCategory, setSelectedCategory] = useState(existing?.category ?? "umrah");
  const [selectedVersion, setSelectedVersion] = useState(existing?.cardVersion ?? "v1");
  const [customCategory, setCustomCategory] = useState("");

  const finalCategory = selectedCategory === "__custom__" ? customCategory.trim().toLowerCase() : selectedCategory;

  const [form, setForm] = useState({
    name: existing?.name ?? "",
    slug: existing?.slug ?? genSlug(),
    tier: existing?.tier ?? "",
    status: existing?.status ?? "active",
    includes: existing?.includes ?? "",
    excludes: existing?.excludes ?? "",
    featured: existing?.featured ?? false,
    copyEnabled: existing?.copyEnabled ?? false,
    groupTicketEnabled: existing?.groupTicketEnabled ?? false,
    visaEnabled: existing?.visaEnabled ?? false,
    price: existing?.price ?? "",
    // V1 hotel (text only)
    hotels: existing?.hotels ?? "",
    // V2 hotel details
    makkahHotel: existing?.makkahHotel ?? "",
    makkahHotelDistance: existing?.makkahHotelDistance ?? "",
    makkahHotelNights: existing?.makkahHotelNights != null ? String(existing.makkahHotelNights) : "",
    madinahHotel: existing?.madinahHotel ?? "",
    madinahHotelDistance: existing?.madinahHotelDistance ?? "",
    madinahHotelNights: existing?.madinahHotelNights != null ? String(existing.madinahHotelNights) : "",
    flightType: existing?.flightType ?? "",
    luggage: existing?.luggage ?? "",
    transportType: existing?.transportType ?? "",
    totalSeats: existing?.totalSeats != null ? String(existing.totalSeats) : "",
    // URL images
    coverImgUrl: "", makkahHotelImgUrl: "", madinahHotelImgUrl: "",
    // Auto-derived (shown read-only)
    depDate: existing?.depDate ?? "", retDate: existing?.retDate ?? "",
    airline: existing?.airline ?? "", route: existing?.route ?? "",
    destination: existing?.destination ?? "", departureCity: existing?.departureCity ?? "",
    duration: existing?.duration ?? "",
  });

  // Images
  const [coverImgMode, setCoverImgMode] = useState<ImgMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [removeGalleryUrls, setRemoveGalleryUrls] = useState<string[]>([]);
  const [makkahImgMode, setMakkahImgMode] = useState<ImgMode>("upload");
  const [makkahHotelFile, setMakkahHotelFile] = useState<File | null>(null);
  const [madinahImgMode, setMadinahImgMode] = useState<ImgMode>("upload");
  const [madinahHotelFile, setMadinahHotelFile] = useState<File | null>(null);

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryStep[]>(() => {
    if (!existing?.itinerary || !Array.isArray(existing.itinerary)) return [];
    return (existing.itinerary as { title?: string; details?: string[]; images?: string[] }[]).map(s => ({
      title: s.title ?? "", details: (s.details ?? []).join("\n"), images: (s.images ?? []).join(", "),
    }));
  });
  const [librarySteps, setLibrarySteps] = useState<LibraryStep[]>([]);

  // Flight sectors
  const [flightSectors, setFlightSectors] = useState<Sector[]>(() => {
    if (!existing?.flightSectors || !Array.isArray(existing.flightSectors)) return defaultSectors();
    return existing.flightSectors as Sector[];
  });

  // Room pricing (create only)
  const [fixedRooms, setFixedRooms] = useState<FixedRooms>(emptyFixedRooms());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load library steps
  useEffect(() => {
    adminFetch("/api/admin/umrah-steps", accessToken, refresh)
      .then(r => r.json()).then(d => setLibrarySteps(d.steps ?? [])).catch(() => {});
  }, [accessToken, refresh]);

  // Auto-derive from sectors whenever sectors change
  useEffect(() => {
    const derived = deriveFromSectors(flightSectors);
    setForm(f => ({ ...f, ...derived }));
  }, [flightSectors]);

  function updateFixedRoom(key: FixedRoomKey, patch: Partial<RoomPrices>) {
    setFixedRooms(r => ({ ...r, [key]: { ...r[key], ...patch } }));
  }

  function lowestRoomPrice(): string | null {
    const prices = (Object.keys(FIXED_ROOM_META) as FixedRoomKey[])
      .map(k => Number(fixedRooms[k].perPerson)).filter(n => n > 0);
    return prices.length ? formatPkr(Math.min(...prices)) : null;
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSubmitting(true); setError(null);

    const body = new FormData();
    body.set("category", finalCategory);
    body.set("name", form.name);
    body.set("slug", form.slug || genSlug());
    body.set("duration", form.duration);
    if (form.depDate) body.set("depDate", form.depDate);
    if (form.retDate) body.set("retDate", form.retDate);
    if (form.airline) body.set("airline", form.airline);
    if (form.route) body.set("route", form.route);
    if (form.destination) body.set("destination", form.destination);
    if (form.departureCity) body.set("departureCity", form.departureCity);
    body.set("tier", form.tier);
    body.set("status", form.status);
    body.set("includes", form.includes);
    body.set("excludes", form.excludes);
    body.set("featured", String(form.featured));
    body.set("copyEnabled", String(form.copyEnabled));
    body.set("groupTicketEnabled", String(form.groupTicketEnabled));
    body.set("visaEnabled", String(form.visaEnabled));
    body.set("cardVersion", selectedVersion);
    // Hotels
    if (selectedVersion === "v1" && form.hotels) body.set("hotels", form.hotels);
    if (selectedVersion === "v2") {
      if (form.makkahHotel) body.set("makkahHotel", form.makkahHotel);
      if (form.makkahHotelDistance) body.set("makkahHotelDistance", form.makkahHotelDistance);
      if (form.makkahHotelNights) body.set("makkahHotelNights", form.makkahHotelNights);
      if (form.madinahHotel) body.set("madinahHotel", form.madinahHotel);
      if (form.madinahHotelDistance) body.set("madinahHotelDistance", form.madinahHotelDistance);
      if (form.madinahHotelNights) body.set("madinahHotelNights", form.madinahHotelNights);
    }
    if (form.flightType) body.set("flightType", form.flightType);
    if (form.luggage) body.set("luggage", form.luggage);
    if (form.transportType) body.set("transportType", form.transportType);
    if (form.totalSeats) body.set("totalSeats", form.totalSeats);

    // Price
    const derivedPrice = !isEdit ? lowestRoomPrice() : null;
    body.set("price", derivedPrice ?? form.price);

    // Images
    if (coverImgMode === "upload" && file) body.set("image", await compressImage(file));
    else if (coverImgMode === "url" && form.coverImgUrl) body.set("imageUrl", form.coverImgUrl);
    for (let i = 0; i < galleryFiles.length; i++) body.set(`gallery_${i}`, await compressImage(galleryFiles[i]));
    if (removeGalleryUrls.length > 0) body.set("removeGalleryUrls", JSON.stringify(removeGalleryUrls));
    if (makkahImgMode === "upload" && makkahHotelFile) body.set("makkahHotelImg", await compressImage(makkahHotelFile));
    else if (makkahImgMode === "url" && form.makkahHotelImgUrl) body.set("makkahHotelImgUrl", form.makkahHotelImgUrl);
    if (madinahImgMode === "upload" && madinahHotelFile) body.set("madinahHotelImg", await compressImage(madinahHotelFile));
    else if (madinahImgMode === "url" && form.madinahHotelImgUrl) body.set("madinahHotelImgUrl", form.madinahHotelImgUrl);

    // Itinerary
    const itinPayload = itinerary.filter(s => s.title.trim()).map(s => ({
      title: s.title.trim(),
      details: s.details.split("\n").map(d => d.trim()).filter(Boolean),
      images: s.images.split(",").map(u => u.trim()).filter(Boolean),
    }));
    if (itinPayload.length > 0) body.set("itinerary", JSON.stringify(itinPayload));

    // Sectors
    const sectorsPayload = flightSectors.filter(s => s.fromIata || s.toIata || s.flightNo);
    if (sectorsPayload.length > 0) body.set("flightSectors", JSON.stringify(sectorsPayload));

    // Room types (create only)
    if (!isEdit) {
      const roomTypesPayload = (Object.keys(FIXED_ROOM_META) as FixedRoomKey[])
        .filter(k => Number(fixedRooms[k].perPerson) > 0)
        .map(k => ({
          roomType: FIXED_ROOM_META[k].label,
          pricePerPersonPkr: Number(fixedRooms[k].perPerson),
          pricePerInfantPkr: Number(fixedRooms[k].perInfant || 0),
          pricePerChildPkr: Number(fixedRooms[k].perChild || 0),
          pricePerChildWithBedPkr: Number(fixedRooms[k].perChild || 0),
          pricePerChildWithoutBedPkr: 0,
          maxAdults: FIXED_ROOM_META[k].maxAdults,
          maxInfants: FIXED_ROOM_META[k].maxInfants,
          minAdultsRequired: null,
        }));
      if (roomTypesPayload.length > 0) body.set("roomTypes", JSON.stringify(roomTypesPayload));
    }

    const url = isEdit ? `/api/admin/packages/${existing!.id}` : "/api/admin/packages";
    const res = await adminFetch(url, accessToken, refresh, { method: isEdit ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Save failed."); setSubmitting(false); return; }
    router.push("/admin/packages");
    router.refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, itinerary, flightSectors, fixedRooms, file, galleryFiles, makkahHotelFile, madinahHotelFile, coverImgMode, makkahImgMode, madinahImgMode, removeGalleryUrls, selectedVersion, finalCategory, isEdit, accessToken, refresh]);

  // ── Step 1: Select category + version ────────────────────────────────────
  if (step === "select") {
    const CATEGORIES = [
      { value: "umrah", label: "🕋 Umrah", desc: "Umrah packages with hotel + flight details" },
      { value: "tours", label: "✈️ Tours", desc: "Domestic or international tour packages" },
      { value: "__custom__", label: "➕ Custom Category", desc: "Define your own category" },
    ];
    return (
      <AdminGuard>
        <AdminShell>
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <button type="button" onClick={() => router.push("/admin/packages")}
                style={{ fontSize: 13, color: "var(--a-blue)", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>New Package</h2>
            </div>

            {/* Category */}
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>1. Category</p>
            <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
              {CATEGORIES.map(c => (
                <label key={c.value} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                  border: `2px solid ${selectedCategory === c.value ? "var(--a-blue)" : "var(--a-border)"}`,
                  borderRadius: 10, cursor: "pointer", background: selectedCategory === c.value ? "#eff6ff" : "#fff" }}>
                  <input type="radio" name="cat" value={c.value} checked={selectedCategory === c.value}
                    onChange={() => setSelectedCategory(c.value)} style={{ width: "auto" }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{c.label}</p>
                    <p style={{ fontSize: 11, color: "var(--a-muted)", margin: 0 }}>{c.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {selectedCategory === "__custom__" && (
              <input value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                placeholder="e.g. hajj, honeymoon, visa-tours" style={{ marginBottom: 24 }} autoFocus />
            )}

            {/* Version */}
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>2. Card Style</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
              {([
                { v: "v1", label: "Classic Card", desc: "Step-by-step itinerary, includes/excludes, hotels as text", icon: "📋" },
                { v: "v2", label: "Detailed Hotel Card", desc: "Hotel photos, specs, distances — ideal for premium listings", icon: "🏨" },
              ] as const).map(({ v, label, desc, icon }) => (
                <label key={v} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "16px",
                  border: `2px solid ${selectedVersion === v ? "var(--a-blue)" : "var(--a-border)"}`,
                  borderRadius: 10, cursor: "pointer", background: selectedVersion === v ? "#eff6ff" : "#fff" }}>
                  <input type="radio" name="ver" value={v} checked={selectedVersion === v}
                    onChange={() => setSelectedVersion(v)} style={{ display: "none" }} />
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <strong style={{ fontSize: 13 }}>{label}</strong>
                  <span style={{ fontSize: 11, color: "var(--a-muted)" }}>{desc}</span>
                </label>
              ))}
            </div>

            <button type="button" onClick={() => {
              if (selectedCategory === "__custom__" && !customCategory.trim()) {
                alert("Please enter a category name."); return;
              }
              setStep("form");
            }} className="adp-btn adp-btn-g" style={{ width: "100%", padding: "12px 0", fontSize: 15 }}>
              Continue →
            </button>
          </div>
        </AdminShell>
      </AdminGuard>
    );
  }

  // ── Step 2: Form ──────────────────────────────────────────────────────────
  const isV2 = selectedVersion === "v2";

  return (
    <AdminGuard>
      <AdminShell>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button type="button" onClick={() => isEdit ? router.push("/admin/packages") : setStep("select")}
              style={{ fontSize: 13, color: "var(--a-blue)", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{isEdit ? `Edit: ${existing!.name}` : "New Package"}</h2>
              <p style={{ margin: 0, fontSize: 11, color: "var(--a-dim)" }}>
                {finalCategory.charAt(0).toUpperCase() + finalCategory.slice(1)} · {isV2 ? "Detailed Hotel Card" : "Classic Card"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>

            {/* ── Basic Info ── */}
            <section style={{ border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "var(--a-blue)" }}>📝 Basic Info</p>
              <div className="adp-fr adp-fg">
                <div>
                  <label>Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Economy Plus Umrah from Faisalabad" />
                </div>
                <div>
                  <label>Slug <span style={{ fontSize: 9, color: "var(--a-dim)" }}>/{finalCategory}/…</span></label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))}
                      style={{ flex: 1, fontFamily: "monospace" }} maxLength={12} />
                    <button type="button" className="adp-btn adp-btn-t" onClick={() => setForm(f => ({ ...f, slug: genSlug() }))}>⟳</button>
                  </div>
                </div>
                <div>
                  <label>Tier</label>
                  <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                    <option value="">— None —</option>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
                <div>
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 20, fontSize: 12, flexWrap: "wrap" }}>
                  {[["featured", "★ Featured on homepage"], ["copyEnabled", "Copy button"], ["groupTicketEnabled", "Group Ticket button"], ["visaEnabled", "Visa button"]].map(([key, label]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={form[key as keyof typeof form] as boolean}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} style={{ width: "auto" }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Flight Sectors ── */}
            <section style={{ border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--a-blue)" }}>✈ Flight Sectors</p>
              <p style={{ fontSize: 11, color: "var(--a-dim)", marginBottom: 14 }}>
                Duration, dates, airline, route, and destination are auto-filled from sectors below.
              </p>
              <FlightSectorsEditor sectors={flightSectors} onChange={setFlightSectors} accessToken={accessToken} />
              {/* Auto-derived read-only summary */}
              {(form.duration || form.depDate || form.airline) && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: 12 }}>
                  {form.duration && <span>📅 <strong>{form.duration}</strong></span>}
                  {form.airline && <span>✈ {form.airline}</span>}
                  {form.route && <span>🗺 {form.route}</span>}
                  {form.depDate && <span>🛫 {form.depDate}</span>}
                  {form.retDate && <span>🛬 {form.retDate}</span>}
                </div>
              )}
            </section>

            {/* ── Room Pricing (create only) ── */}
            {!isEdit && (
              <section style={{ border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px", background: "#f8fafc" }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--a-blue)" }}>🛏 Room Pricing</p>
                <p style={{ fontSize: 11, color: "var(--a-dim)", marginBottom: 14 }}>Leave price blank if this room type is not offered.</p>
                <div style={{ display: "grid", gap: 8 }}>
                  {(Object.keys(FIXED_ROOM_META) as FixedRoomKey[]).map(k => {
                    const meta = FIXED_ROOM_META[k];
                    const prices = fixedRooms[k];
                    const has = Number(prices.perPerson) > 0;
                    return (
                      <div key={k} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr", gap: 8, alignItems: "end",
                        padding: "10px 12px", border: "1px solid var(--a-border)", borderRadius: 8,
                        background: has ? "#fff" : "#f1f5f9", opacity: has ? 1 : 0.75 }}>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700 }}>{meta.label}</label>
                          {!has && <span style={{ fontSize: 9, color: "#94a3b8", display: "block" }}>not offered</span>}
                        </div>
                        <div><label style={{ fontSize: 9 }}>Price/Person *</label>
                          <input type="number" placeholder="e.g. 150000" value={prices.perPerson} onChange={e => updateFixedRoom(k, { perPerson: e.target.value })} /></div>
                        <div><label style={{ fontSize: 9 }}>Price/Child</label>
                          <input type="number" placeholder="0" value={prices.perChild} onChange={e => updateFixedRoom(k, { perChild: e.target.value })} disabled={!has} /></div>
                        <div><label style={{ fontSize: 9 }}>Price/Infant</label>
                          <input type="number" placeholder="0" value={prices.perInfant} onChange={e => updateFixedRoom(k, { perInfant: e.target.value })} disabled={!has} /></div>
                      </div>
                    );
                  })}
                </div>
                {lowestRoomPrice() && (
                  <p style={{ fontSize: 11, color: "var(--a-green)", marginTop: 8 }}>✓ Display price: {lowestRoomPrice()}</p>
                )}
              </section>
            )}

            {/* ── Hotels ── */}
            <section style={{ border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "var(--a-blue)" }}>🏨 Hotels</p>
              {!isV2 ? (
                <div>
                  <label>Hotel Details (text)</label>
                  <textarea rows={2} placeholder="e.g. Makkah: Qila Ajyad (11 Nights, 1400m from Haram)&#10;Madinah: Kinan Madina (8 Nights, 900m from Prophet Mosque)"
                    value={form.hotels} onChange={e => setForm(f => ({ ...f, hotels: e.target.value }))} style={{ resize: "vertical" }} />
                </div>
              ) : (
                <div className="adp-fr adp-fg">
                  <div><label style={{ fontSize: 11 }}>Makkah Hotel Name</label>
                    <input value={form.makkahHotel} onChange={e => setForm(f => ({ ...f, makkahHotel: e.target.value }))} placeholder="e.g. Qila Ajyad" /></div>
                  <div><label style={{ fontSize: 11 }}>Distance from Haram</label>
                    <input value={form.makkahHotelDistance} onChange={e => setForm(f => ({ ...f, makkahHotelDistance: e.target.value }))} placeholder="e.g. 1400m" /></div>
                  <div><label style={{ fontSize: 11 }}>Makkah Nights</label>
                    <input type="number" value={form.makkahHotelNights} onChange={e => setForm(f => ({ ...f, makkahHotelNights: e.target.value }))} placeholder="e.g. 11" /></div>
                  <div><label style={{ fontSize: 11 }}>Makkah Hotel Photo</label>
                    <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                      {(["upload", "url"] as ImgMode[]).map(m => (
                        <button key={m} type="button" onClick={() => setMakkahImgMode(m)}
                          style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, border: "1.5px solid", cursor: "pointer",
                            background: makkahImgMode === m ? "#0ea5e9" : "transparent", color: makkahImgMode === m ? "#fff" : "var(--a-muted)",
                            borderColor: makkahImgMode === m ? "#0ea5e9" : "var(--a-border)" }}>{m === "upload" ? "📁 Upload" : "🔗 URL"}</button>
                      ))}
                    </div>
                    {makkahImgMode === "upload" ? <input type="file" accept="image/*" onChange={e => setMakkahHotelFile(e.target.files?.[0] ?? null)} />
                      : <input placeholder="https://…" value={form.makkahHotelImgUrl} onChange={e => setForm(f => ({ ...f, makkahHotelImgUrl: e.target.value }))} />}
                  </div>
                  <div><label style={{ fontSize: 11 }}>Madinah Hotel Name</label>
                    <input value={form.madinahHotel} onChange={e => setForm(f => ({ ...f, madinahHotel: e.target.value }))} placeholder="e.g. Kinan Madina" /></div>
                  <div><label style={{ fontSize: 11 }}>Distance from Masjid Nabawi</label>
                    <input value={form.madinahHotelDistance} onChange={e => setForm(f => ({ ...f, madinahHotelDistance: e.target.value }))} placeholder="e.g. 900m" /></div>
                  <div><label style={{ fontSize: 11 }}>Madinah Nights</label>
                    <input type="number" value={form.madinahHotelNights} onChange={e => setForm(f => ({ ...f, madinahHotelNights: e.target.value }))} placeholder="e.g. 8" /></div>
                  <div><label style={{ fontSize: 11 }}>Madinah Hotel Photo</label>
                    <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                      {(["upload", "url"] as ImgMode[]).map(m => (
                        <button key={m} type="button" onClick={() => setMadinahImgMode(m)}
                          style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, border: "1.5px solid", cursor: "pointer",
                            background: madinahImgMode === m ? "#0ea5e9" : "transparent", color: madinahImgMode === m ? "#fff" : "var(--a-muted)",
                            borderColor: madinahImgMode === m ? "#0ea5e9" : "var(--a-border)" }}>{m === "upload" ? "📁 Upload" : "🔗 URL"}</button>
                      ))}
                    </div>
                    {madinahImgMode === "upload" ? <input type="file" accept="image/*" onChange={e => setMadinahHotelFile(e.target.files?.[0] ?? null)} />
                      : <input placeholder="https://…" value={form.madinahHotelImgUrl} onChange={e => setForm(f => ({ ...f, madinahHotelImgUrl: e.target.value }))} />}
                  </div>
                  <div><label style={{ fontSize: 11 }}>Transport Type</label>
                    <input value={form.transportType} onChange={e => setForm(f => ({ ...f, transportType: e.target.value }))} placeholder="e.g. A/C Bus" /></div>
                  <div><label style={{ fontSize: 11 }}>Luggage Allowance</label>
                    <input value={form.luggage} onChange={e => setForm(f => ({ ...f, luggage: e.target.value }))} placeholder="e.g. 23kg" /></div>
                  <div><label style={{ fontSize: 11 }}>Flight Type</label>
                    <input value={form.flightType} onChange={e => setForm(f => ({ ...f, flightType: e.target.value }))} placeholder="e.g. Direct, Via Dubai" /></div>
                  <div><label style={{ fontSize: 11 }}>Total Seats</label>
                    <input type="number" value={form.totalSeats} onChange={e => setForm(f => ({ ...f, totalSeats: e.target.value }))} placeholder="e.g. 40" /></div>
                </div>
              )}
            </section>

            {/* ── Itinerary ── */}
            <section style={{ border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--a-blue)" }}>📋 Itinerary Steps</p>
              <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
                {itinerary.map((step, i) => (
                  <div key={i} style={{ border: "1px solid var(--a-border)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <input placeholder={`Step ${i + 1} title — type or pick from library`}
                        value={step.title} onChange={e => setItinerary(s => s.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                        list={`slib-${i}`} style={{ flex: 1 }} />
                      <datalist id={`slib-${i}`}>{librarySteps.map(s => <option key={s.id} value={s.title} />)}</datalist>
                      <button type="button" onClick={() => {
                        const match = librarySteps.find(s => s.title === step.title);
                        if (match?.description) setItinerary(s => s.map((x, j) => j === i ? { ...x, details: match.description! } : x));
                      }} className="adp-btn adp-btn-t" style={{ fontSize: 11 }} title="Auto-fill from library">↓</button>
                      <button type="button" onClick={() => setItinerary(s => s.filter((_, j) => j !== i))} className="adp-btn adp-btn-r" style={{ fontSize: 11 }}>✕</button>
                    </div>
                    <textarea placeholder="Details, one bullet per line" rows={2} value={step.details}
                      onChange={e => setItinerary(s => s.map((x, j) => j === i ? { ...x, details: e.target.value } : x))}
                      style={{ marginBottom: 6 }} />
                    <input placeholder="Image URLs, comma-separated (optional)" value={step.images}
                      onChange={e => setItinerary(s => s.map((x, j) => j === i ? { ...x, images: e.target.value } : x))} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setItinerary(s => [...s, { title: "", details: "", images: "" }])} className="adp-btn adp-btn-t">
                + Add Step
              </button>
              {librarySteps.length === 0 && (
                <span style={{ fontSize: 11, color: "var(--a-dim)", marginLeft: 10 }}>
                  💡 <a href="/admin/umrah-steps" target="_blank" style={{ color: "var(--a-blue)" }}>Build Step Library</a> for autocomplete
                </span>
              )}
            </section>

            {/* ── Includes/Excludes (V1 only) ── */}
            {!isV2 && (
              <section style={{ border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "var(--a-blue)" }}>✅ Includes &amp; Excludes</p>
                <div className="adp-fr adp-fg">
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>What&apos;s Included (one per line)</label>
                    <textarea rows={4} value={form.includes} onChange={e => setForm(f => ({ ...f, includes: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Not Included (one per line)</label>
                    <textarea rows={4} value={form.excludes} onChange={e => setForm(f => ({ ...f, excludes: e.target.value }))} />
                  </div>
                </div>
              </section>
            )}

            {/* ── Images ── */}
            <section style={{ border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: "var(--a-blue)" }}>🖼 Images</p>
              <div className="adp-fr adp-fg">
                <div>
                  <label>Cover Image</label>
                  <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>
                    {(["upload", "url"] as ImgMode[]).map(m => (
                      <button key={m} type="button" onClick={() => setCoverImgMode(m)}
                        style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "1.5px solid", cursor: "pointer",
                          background: coverImgMode === m ? "var(--a-blue)" : "transparent", color: coverImgMode === m ? "#fff" : "var(--a-muted)",
                          borderColor: coverImgMode === m ? "var(--a-blue)" : "var(--a-border)" }}>{m === "upload" ? "📁 Upload" : "🔗 URL"}</button>
                    ))}
                  </div>
                  {coverImgMode === "upload" ? <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    : <input placeholder="https://…" value={form.coverImgUrl} onChange={e => setForm(f => ({ ...f, coverImgUrl: e.target.value }))} />}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Gallery Images (carousel on detail page)</label>
                  {isEdit && (existing!.galleryUrls ?? []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      {(existing!.galleryUrls ?? []).map(url => (
                        <div key={url} style={{ position: "relative", width: 72, height: 72 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6, opacity: removeGalleryUrls.includes(url) ? 0.3 : 1 }} />
                          <button type="button" onClick={() => setRemoveGalleryUrls(r => r.includes(url) ? r.filter(u => u !== url) : [...r, url])}
                            style={{ position: "absolute", top: 2, right: 2, background: removeGalleryUrls.includes(url) ? "#16a34a" : "#ef4444", color: "white", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer" }}>
                            {removeGalleryUrls.includes(url) ? "↩" : "×"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input type="file" accept="image/*" multiple onChange={e => setGalleryFiles(Array.from(e.target.files ?? []))} />
                </div>
              </div>
            </section>

            {error && <p style={{ color: "var(--a-red)", fontSize: 13 }}>{error}</p>}

            <div style={{ display: "flex", gap: 12, paddingBottom: 40 }}>
              <button type="submit" className="adp-btn adp-btn-g" disabled={submitting} style={{ flex: 2, padding: "12px 0", fontSize: 14 }}>
                {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Package"}
              </button>
              <button type="button" className="adp-btn adp-btn-t" onClick={() => router.push("/admin/packages")} style={{ flex: 1, padding: "12px 0" }}>
                Cancel
              </button>
            </div>
          </form>

          {/* Room Types Manager (edit only) */}
          {isEdit && (
            <PackageRoomTypesManager
              packageId={existing!.id}
              roomTypes={existing!.roomTypes}
              accessToken={accessToken}
              refresh={refresh}
              onChange={() => {}}
            />
          )}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
