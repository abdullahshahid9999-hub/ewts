"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import PackageRoomTypesManager from "@/components/PackageRoomTypesManager";
import FlightSectorsEditor, { Sector, defaultSectors } from "@/components/FlightSectorsEditor";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type RoomType = {
  id: string;
  roomType: string;
  pricePerPersonPkr: number;
  pricePerInfantPkr: number;
  pricePerChildPkr: number;
  pricePerChildWithBedPkr: number;
  pricePerChildWithoutBedPkr: number;
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
  availableSlots: number | null;
};

type ItineraryStep = { title: string; details: string; images: string };
type LibraryStep = { id: string; title: string; description: string | null; imageUrl: string | null; tag: string };
// FlightSector = Sector from FlightSectorsEditor (imported above)
type FlightSector = Sector;
// Fixed 4 room types — Sharing & Quad optional (price blank = not offered)
type FixedRoomKey = "quad" | "triple" | "double" | "sharing";
type RoomPrices = { perPerson: string; perChild: string; perInfant: string };
type FixedRooms = Record<FixedRoomKey, RoomPrices>;

const FIXED_ROOM_META: Record<FixedRoomKey, { label: string; maxAdults: number; maxInfants: number; optional: boolean }> = {
  quad:    { label: "Quad Room (4 pax)",     maxAdults: 4, maxInfants: 1, optional: true },
  triple:  { label: "Triple Room (3 pax)",   maxAdults: 3, maxInfants: 1, optional: false },
  double:  { label: "Double Room (2 pax)",   maxAdults: 2, maxInfants: 1, optional: false },
  sharing: { label: "Sharing (6+ pax)",      maxAdults: 6, maxInfants: 0, optional: true },
};

const emptyRoomPrices = (): RoomPrices => ({ perPerson: "", perChild: "0", perInfant: "0" });
const emptyFixedRooms = (): FixedRooms => ({
  quad: emptyRoomPrices(), triple: emptyRoomPrices(),
  double: emptyRoomPrices(), sharing: emptyRoomPrices(),
});

// Legacy — keep for type compat with old draftRoomTypes refs removed below
type DraftRoomType = { roomType: string; pricePerPersonPkr: string; pricePerInfantPkr: string; pricePerChildPkr: string; pricePerChildWithBedPkr: string; pricePerChildWithoutBedPkr: string; maxAdults: string; maxInfants: string; minAdultsRequired: string };
const ROOM_BASIS_PRESETS: string[] = [];

function formatPkr(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function genSlug() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// For image fields that support Upload OR URL
type ImgMode = "upload" | "url";

// Mirrors lib/packagePrice.ts's computeDisplayPrice on the server — the
// listing-card price is always the lowest per-person room price, shown
// live here as the admin fills in the room basis rows so there's no
// surprise about what will actually be saved.
// (removed computeDisplayPriceFromDrafts — replaced by computeDisplayPriceFromFixed)

type Package = {
  id: string;
  category: string;
  name: string;
  slug: string | null;
  duration: string | null;
  depDate: string | null;
  retDate: string | null;
  airline: string | null;
  route: string | null;
  hotels: string | null;
  price: string | null;
  destination: string | null;
  departureCity: string | null;
  tier: string | null;
  includes: string | null;
  excludes: string | null;
  itinerary: unknown;
  flightSectors: unknown;
  imageUrl: string | null;
  galleryUrls: string[] | null;
  copyEnabled: boolean;
  groupTicketEnabled: boolean;
  visaEnabled: boolean;
  featured: boolean;
  status: string;
  cardVersion: string | null;
  makkahHotel: string | null;
  makkahHotelDistance: string | null;
  makkahHotelNights: number | null;
  makkahHotelImg: string | null;
  madinahHotel: string | null;
  madinahHotelDistance: string | null;
  madinahHotelNights: number | null;
  madinahHotelImg: string | null;
  flightType: string | null;
  luggage: string | null;
  transportType: string | null;
  totalSeats: number | null;
  seatsBooked: number;
  roomTypes: RoomType[];
  _count?: { bookings: number };
};

const emptyForm = {
  category: "umrah", name: "", slug: genSlug(), duration: "", depDate: "", retDate: "",
  airline: "", route: "", hotels: "",
  price: "", destination: "",
  departureCity: "", tier: "", includes: "", excludes: "", featured: false, status: "active",
  copyEnabled: false, groupTicketEnabled: false, visaEnabled: false,
  // V2 fields
  cardVersion: "v1",
  makkahHotel: "", makkahHotelDistance: "", makkahHotelNights: "",
  madinahHotel: "", madinahHotelDistance: "", madinahHotelNights: "",
  flightType: "", luggage: "", transportType: "", totalSeats: "",
  // URL-based image alternatives
  coverImgUrl: "", makkahHotelImgUrl: "", madinahHotelImgUrl: "",
};

// Legacy no-ops kept for zero TS refs below — safe to delete after full cleanup
function _unusedLegacy() { void 0; }

// defaultSectors imported from FlightSectorsEditor
function sectorsFromPackage(pkg: Package): FlightSector[] {
  if (!Array.isArray(pkg.flightSectors) || pkg.flightSectors.length === 0) return defaultSectors();
  return pkg.flightSectors as FlightSector[];
}

function itineraryFromPackage(pkg: Package): ItineraryStep[] {
  if (!Array.isArray(pkg.itinerary)) return [];
  return (pkg.itinerary as { title?: string; details?: string[]; images?: string[] }[]).map((s) => ({
    title: s.title ?? "",
    details: (s.details ?? []).join("\n"),
    images: (s.images ?? []).join(", "),
  }));
}

function PackagesInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  // Cover image
  const [file, setFile] = useState<File | null>(null);
  const [coverImgMode, setCoverImgMode] = useState<ImgMode>("upload");
  // Gallery
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [removeGalleryUrls, setRemoveGalleryUrls] = useState<string[]>([]);
  // Hotel images
  const [makkahHotelFile, setMakkahHotelFile] = useState<File | null>(null);
  const [makkahImgMode, setMakkahImgMode] = useState<ImgMode>("upload");
  const [madinahHotelFile, setMadinahHotelFile] = useState<File | null>(null);
  const [madinahImgMode, setMadinahImgMode] = useState<ImgMode>("upload");
  // Fixed room types (create mode)
  const [fixedRooms, setFixedRooms] = useState<FixedRooms>(emptyFixedRooms());
  const [draftRoomTypes, setDraftRoomTypes] = useState<DraftRoomType[]>([]); // legacy compat
  const [itinerary, setItinerary] = useState<ItineraryStep[]>([]);
  const [librarySteps, setLibrarySteps] = useState<LibraryStep[]>([]);
  const [flightSectors, setFlightSectors] = useState<FlightSector[]>(() => defaultSectors());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/packages");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not load packages.");
      setPackages([]);
      setLoading(false);
      return;
    }
    setPackages(data.packages ?? []);
    setLoading(false);
    // Load step library
    adminFetch("/api/admin/umrah-steps", accessToken, refresh).then(r => r.json()).then(d => setLibrarySteps(d.steps ?? [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(pkg: Package) {
    setEditingId(pkg.id);
    setForm({
      category: pkg.category, name: pkg.name, slug: pkg.slug ?? "", duration: pkg.duration ?? "",
      depDate: pkg.depDate ?? "", retDate: pkg.retDate ?? "",
      airline: pkg.airline ?? "", route: pkg.route ?? "", hotels: pkg.hotels ?? "",
      price: pkg.price ?? "", destination: pkg.destination ?? "", departureCity: pkg.departureCity ?? "",
      tier: pkg.tier ?? "", includes: pkg.includes ?? "", excludes: pkg.excludes ?? "",
      featured: pkg.featured, status: pkg.status,
      copyEnabled: pkg.copyEnabled, groupTicketEnabled: pkg.groupTicketEnabled, visaEnabled: pkg.visaEnabled,
      // V2 fields
      cardVersion: pkg.cardVersion ?? "v1",
      makkahHotel: pkg.makkahHotel ?? "", makkahHotelDistance: pkg.makkahHotelDistance ?? "",
      makkahHotelNights: pkg.makkahHotelNights != null ? String(pkg.makkahHotelNights) : "",
      madinahHotel: pkg.madinahHotel ?? "", madinahHotelDistance: pkg.madinahHotelDistance ?? "",
      madinahHotelNights: pkg.madinahHotelNights != null ? String(pkg.madinahHotelNights) : "",
      flightType: pkg.flightType ?? "", luggage: pkg.luggage ?? "",
      transportType: pkg.transportType ?? "",
      totalSeats: pkg.totalSeats != null ? String(pkg.totalSeats) : "",
      coverImgUrl: "", makkahHotelImgUrl: "", madinahHotelImgUrl: "",
    });
    setItinerary(itineraryFromPackage(pkg));
    setFlightSectors(sectorsFromPackage(pkg));
    setFixedRooms(emptyFixedRooms());
    setFile(null); setCoverImgMode("upload");
    setGalleryFiles([]);
    setRemoveGalleryUrls([]);
    setMakkahHotelFile(null); setMakkahImgMode("upload");
    setMadinahHotelFile(null); setMadinahImgMode("upload");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, slug: genSlug() });
    setItinerary([]);
    setFlightSectors(defaultSectors());
    setFixedRooms(emptyFixedRooms());
    setFile(null); setCoverImgMode("upload");
    setGalleryFiles([]);
    setRemoveGalleryUrls([]);
    setMakkahHotelFile(null); setMakkahImgMode("upload");
    setMadinahHotelFile(null); setMadinahImgMode("upload");
    setError(null);
  }

  function addItineraryStep() {
    setItinerary((s) => [...s, { title: "", details: "", images: "" }]);
  }

  function updateItineraryStep(i: number, patch: Partial<ItineraryStep>) {
    setItinerary((s) => s.map((step, idx) => (idx === i ? { ...step, ...patch } : step)));
  }

  function removeItineraryStep(i: number) {
    setItinerary((s) => s.filter((_, idx) => idx !== i));
  }

  function updateFixedRoom(key: FixedRoomKey, patch: Partial<RoomPrices>) {
    setFixedRooms((r) => ({ ...r, [key]: { ...r[key], ...patch } }));
  }

  // For legacy price display calculation
  function computeDisplayPriceFromFixed(rooms: FixedRooms): string | null {
    const prices = (Object.keys(FIXED_ROOM_META) as FixedRoomKey[])
      .map((k) => Number(rooms[k].perPerson))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length === 0) return null;
    return formatPkr(Math.min(...prices));
  }

  // (legacy draft room type functions removed — use fixedRooms + updateFixedRoom)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);

    const body = new FormData();
    body.set("category", form.category);
    body.set("name", form.name);
    body.set("slug", form.slug || genSlug());
    body.set("duration", form.duration);
    if (form.depDate) body.set("depDate", form.depDate);
    if (form.retDate) body.set("retDate", form.retDate);
    if (form.airline) body.set("airline", form.airline);
    if (form.route) body.set("route", form.route);
    if (form.hotels) body.set("hotels", form.hotels);
    const derivedPrice = !editingId ? computeDisplayPriceFromFixed(fixedRooms) : null;
    body.set("price", derivedPrice ?? form.price);
    body.set("destination", form.destination);
    body.set("departureCity", form.departureCity);
    body.set("tier", form.tier);
    body.set("includes", form.includes);
    body.set("excludes", form.excludes);
    body.set("featured", String(form.featured));
    body.set("status", form.status);
    body.set("copyEnabled", String(form.copyEnabled));
    body.set("groupTicketEnabled", String(form.groupTicketEnabled));
    body.set("visaEnabled", String(form.visaEnabled));
    body.set("cardVersion", form.cardVersion);
    if (form.makkahHotel) body.set("makkahHotel", form.makkahHotel);
    if (form.makkahHotelDistance) body.set("makkahHotelDistance", form.makkahHotelDistance);
    if (form.makkahHotelNights) body.set("makkahHotelNights", form.makkahHotelNights);
    if (form.madinahHotel) body.set("madinahHotel", form.madinahHotel);
    if (form.madinahHotelDistance) body.set("madinahHotelDistance", form.madinahHotelDistance);
    if (form.madinahHotelNights) body.set("madinahHotelNights", form.madinahHotelNights);
    if (form.flightType) body.set("flightType", form.flightType);
    if (form.luggage) body.set("luggage", form.luggage);
    if (form.transportType) body.set("transportType", form.transportType);
    if (form.totalSeats) body.set("totalSeats", form.totalSeats);
    // Cover image: upload OR URL
    if (coverImgMode === "upload" && file) body.set("image", await compressImage(file));
    else if (coverImgMode === "url" && form.coverImgUrl.trim()) body.set("imageUrl", form.coverImgUrl.trim());
    // Gallery
    for (let i = 0; i < galleryFiles.length; i++) {
      body.set(`gallery_${i}`, await compressImage(galleryFiles[i]));
    }
    if (removeGalleryUrls.length > 0) body.set("removeGalleryUrls", JSON.stringify(removeGalleryUrls));
    // Hotel images: upload OR URL
    if (makkahImgMode === "upload" && makkahHotelFile) body.set("makkahHotelImg", await compressImage(makkahHotelFile));
    else if (makkahImgMode === "url" && form.makkahHotelImgUrl.trim()) body.set("makkahHotelImgUrl", form.makkahHotelImgUrl.trim());
    if (madinahImgMode === "upload" && madinahHotelFile) body.set("madinahHotelImg", await compressImage(madinahHotelFile));
    else if (madinahImgMode === "url" && form.madinahHotelImgUrl.trim()) body.set("madinahHotelImgUrl", form.madinahHotelImgUrl.trim());

    const itineraryPayload = itinerary
      .filter((s) => s.title.trim())
      .map((s) => ({
        title: s.title.trim(),
        details: s.details.split("\n").map((d) => d.trim()).filter(Boolean),
        images: s.images.split(",").map((u) => u.trim()).filter(Boolean),
      }));
    if (itineraryPayload.length > 0) body.set("itinerary", JSON.stringify(itineraryPayload));

    const sectorsPayload = flightSectors.filter((sec) => sec.fromIata || sec.toIata || sec.flightNo);
    if (sectorsPayload.length > 0) body.set("flightSectors", JSON.stringify(sectorsPayload));

    // Fixed room types (Quad/Triple/Double/Sharing) — only on create
    if (!editingId) {
      const roomTypesPayload = (Object.keys(FIXED_ROOM_META) as FixedRoomKey[])
        .filter((k) => Number(fixedRooms[k].perPerson) > 0)
        .map((k) => ({
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

    const url = editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save package."); return; }
    if (!editingId) {
      // Jump straight into editing the new package so more room types can
      // be added/edited immediately — the ones just submitted are already
      // saved, this just switches to the "existing package" management view.
      setEditingId(data.package.id);
      setFixedRooms(emptyFixedRooms());
    }
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package? This also deletes its room types.")) return;
    await adminFetch(`/api/admin/packages/${id}`, accessToken, refresh, { method: "DELETE" });
    if (editingId === id) resetForm();
    load();
  }

  async function handleDuplicate(id: string) {
    if (!confirm("Duplicate this package? A copy will be created as inactive.")) return;
    const res = await adminFetch(`/api/admin/packages/${id}/duplicate`, accessToken, refresh, { method: "POST" });
    if (res?.ok) load();
    else alert("Duplicate failed.");
  }

  const editingPackage = packages.find((p) => p.id === editingId) ?? null;

  return (
    <>
      <div className="adp-ph">
        <div><h2>Package <em>Management</em></h2><p>Umrah &amp; tour packages, room pricing, and itineraries</p></div>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>{editingId ? "Edit Package" : "New Package"}</h3></div>
        <form onSubmit={handleSubmit} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div>
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="umrah">Umrah</option>
              <option value="tours">Tours</option>
            </select>
          </div>
          <div>
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Slug (URL — /{form.category}/…) <span style={{ fontSize: 10, color: "var(--a-dim)", fontWeight: 400 }}>Auto-generated · customer sees only UI, not this code</span></label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))}
                style={{ flex: 1, fontFamily: "monospace" }}
                maxLength={12}
              />
              <button type="button" className="adp-btn adp-btn-t" onClick={() => setForm((f) => ({ ...f, slug: genSlug() }))}>
                Regenerate
              </button>
            </div>
          </div>
          <div>
            <label>Duration</label>
            <input placeholder="e.g. 10 Days" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </div>
          <div>
            <label>Departure Date</label>
            <input type="date" value={form.depDate} onChange={(e) => setForm((f) => ({ ...f, depDate: e.target.value }))} />
          </div>
          <div>
            <label>Return Date</label>
            <input type="date" value={form.retDate} onChange={(e) => setForm((f) => ({ ...f, retDate: e.target.value }))} />
          </div>
          <div>
            <label>Airline</label>
            <input placeholder="e.g. PIA, Air Arabia" value={form.airline} onChange={(e) => setForm((f) => ({ ...f, airline: e.target.value }))} />
          </div>
          <div>
            <label>Route / Sectors</label>
            <input placeholder="e.g. LHE–JED–LHE" value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Hotels (Makkah &amp; Madinah details)</label>
            <textarea rows={2} placeholder="e.g. Makkah: Qila Ajyad (11 Nights, 1400m from Haram)&#10;Madinah: Kinan Madina (8 Nights, 900m from Prophet Mosque)" value={form.hotels} onChange={(e) => setForm((f) => ({ ...f, hotels: e.target.value }))} style={{ resize: "vertical" }} />
          </div>
          <div>
            <label>Price (listing display — auto-calculated)</label>
            <input
              readOnly
              disabled
              value={
                editingId
                  ? (form.price || "— set by adding room types below —")
                  : (computeDisplayPriceFromFixed(fixedRooms) ?? "— fill at least one room price above —")
              }
              style={{ color: "var(--a-muted)", background: "rgba(0,0,0,0.03)", cursor: "not-allowed" }}
            />
            <p style={{ fontSize: "10.5px", color: "var(--a-dim)", marginTop: "4px" }}>
              This is always the lowest per-person room price below (usually Quad) — it's what
              shows on the package card. It updates automatically whenever room basis pricing
              changes, so it can't drift out of sync.
            </p>
          </div>
          <div>
            <label>Destination</label>
            <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} />
          </div>
          <div>
            <label>Departure City</label>
            <input placeholder="e.g. Lahore" value={form.departureCity} onChange={(e) => setForm((f) => ({ ...f, departureCity: e.target.value }))} />
          </div>
          <div>
            <label>Tier</label>
            <select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
              <option value="">— None —</option>
              <option value="SILVER">Silver</option>
              <option value="GOLD">Gold</option>
              <option value="PLATINUM">Platinum</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>What&apos;s Included (one per line)</label>
            <textarea rows={3} value={form.includes} onChange={(e) => setForm((f) => ({ ...f, includes: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Not Included (one per line)</label>
            <textarea rows={3} value={form.excludes} onChange={(e) => setForm((f) => ({ ...f, excludes: e.target.value }))} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} style={{ width: "auto" }} />
            Featured on homepage
          </div>
          <div>
            <label>Cover Image</label>
            <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              {(["upload", "url"] as ImgMode[]).map((m) => (
                <button key={m} type="button" onClick={() => setCoverImgMode(m)}
                  style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "1.5px solid", cursor: "pointer",
                    background: coverImgMode === m ? "var(--a-blue)" : "transparent",
                    color: coverImgMode === m ? "#fff" : "var(--a-muted)",
                    borderColor: coverImgMode === m ? "var(--a-blue)" : "var(--a-border)" }}>
                  {m === "upload" ? "📁 Upload" : "🔗 URL"}
                </button>
              ))}
            </div>
            {coverImgMode === "upload"
              ? <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              : <input placeholder="https://…" value={form.coverImgUrl} onChange={(e) => setForm((f) => ({ ...f, coverImgUrl: e.target.value }))} />}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Gallery Images (multiple, carousel on detail page)</label>
            {editingId && packages.find(p => p.id === editingId)?.galleryUrls && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {(packages.find(p => p.id === editingId)?.galleryUrls ?? []).map((url) => (
                  <div key={url} style={{ position: "relative", width: "72px", height: "72px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "6px", opacity: removeGalleryUrls.includes(url) ? 0.3 : 1 }} />
                    <button type="button" onClick={() => setRemoveGalleryUrls(r => r.includes(url) ? r.filter(u => u !== url) : [...r, url])}
                      style={{ position: "absolute", top: "2px", right: "2px", background: removeGalleryUrls.includes(url) ? "#16a34a" : "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {removeGalleryUrls.includes(url) ? "↩" : "×"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))} />
            {galleryFiles.length > 0 && <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>{galleryFiles.length} file(s) selected</p>}
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "20px", fontSize: "12px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" checked={form.copyEnabled} onChange={(e) => setForm((f) => ({ ...f, copyEnabled: e.target.checked }))} style={{ width: "auto" }} />
              Copy button active
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" checked={form.groupTicketEnabled} onChange={(e) => setForm((f) => ({ ...f, groupTicketEnabled: e.target.checked }))} style={{ width: "auto" }} />
              Group Ticket button active
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" checked={form.visaEnabled} onChange={(e) => setForm((f) => ({ ...f, visaEnabled: e.target.checked }))} style={{ width: "auto" }} />
              Visa button active
            </label>
          </div>

          {/* ── CARD DESIGN VERSION ── */}
          <div style={{ gridColumn: "1 / -1", background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 10, padding: "16px 18px" }}>
            <label style={{ fontWeight: 700, fontSize: 13, color: "#0369a1", marginBottom: 10, display: "block" }}>
              🎨 Card Design Version (Admin Only — users cannot change this)
            </label>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              {(["v1", "v2"] as const).map((v) => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                  background: form.cardVersion === v ? "#0ea5e9" : "#e0f2fe", color: form.cardVersion === v ? "#fff" : "#0369a1",
                  border: `1.5px solid ${form.cardVersion === v ? "#0284c7" : "#7dd3fc"}`, borderRadius: 8, padding: "6px 16px", fontWeight: 700, fontSize: 12 }}>
                  <input type="radio" name="cardVersion" value={v} checked={form.cardVersion === v}
                    onChange={() => setForm((f) => ({ ...f, cardVersion: v }))} style={{ width: "auto" }} />
                  {v === "v1" ? "V1 — Classic Card" : "V2 — Umrah Detail Card (Hotel Photos + Specs)"}
                </label>
              ))}
            </div>

            {form.cardVersion === "v2" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Makkah Hotel */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Makkah Hotel Name</label>
                  <input value={form.makkahHotel} onChange={(e) => setForm((f) => ({ ...f, makkahHotel: e.target.value }))} placeholder="e.g. Qila Ajyad" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Makkah Hotel Distance</label>
                  <input value={form.makkahHotelDistance} onChange={(e) => setForm((f) => ({ ...f, makkahHotelDistance: e.target.value }))} placeholder="e.g. 1400m from Haram" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Makkah Hotel Nights</label>
                  <input type="number" value={form.makkahHotelNights} onChange={(e) => setForm((f) => ({ ...f, makkahHotelNights: e.target.value }))} placeholder="e.g. 11" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Makkah Hotel Photo</label>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>
                    {(["upload", "url"] as ImgMode[]).map((m) => (
                      <button key={m} type="button" onClick={() => setMakkahImgMode(m)}
                        style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, border: "1.5px solid", cursor: "pointer",
                          background: makkahImgMode === m ? "#0ea5e9" : "transparent",
                          color: makkahImgMode === m ? "#fff" : "var(--a-muted)",
                          borderColor: makkahImgMode === m ? "#0ea5e9" : "var(--a-border)" }}>
                        {m === "upload" ? "📁 Upload" : "🔗 URL"}
                      </button>
                    ))}
                  </div>
                  {makkahImgMode === "upload"
                    ? <input type="file" accept="image/*" onChange={(e) => setMakkahHotelFile(e.target.files?.[0] ?? null)} />
                    : <input placeholder="https://…" value={form.makkahHotelImgUrl} onChange={(e) => setForm((f) => ({ ...f, makkahHotelImgUrl: e.target.value }))} />}
                </div>
                {/* Madinah Hotel */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Madinah Hotel Name</label>
                  <input value={form.madinahHotel} onChange={(e) => setForm((f) => ({ ...f, madinahHotel: e.target.value }))} placeholder="e.g. Kinan Madina" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Madinah Hotel Distance</label>
                  <input value={form.madinahHotelDistance} onChange={(e) => setForm((f) => ({ ...f, madinahHotelDistance: e.target.value }))} placeholder="e.g. 900m from Prophet's Mosque" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Madinah Hotel Nights</label>
                  <input type="number" value={form.madinahHotelNights} onChange={(e) => setForm((f) => ({ ...f, madinahHotelNights: e.target.value }))} placeholder="e.g. 8" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Madinah Hotel Photo</label>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>
                    {(["upload", "url"] as ImgMode[]).map((m) => (
                      <button key={m} type="button" onClick={() => setMadinahImgMode(m)}
                        style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, border: "1.5px solid", cursor: "pointer",
                          background: madinahImgMode === m ? "#0ea5e9" : "transparent",
                          color: madinahImgMode === m ? "#fff" : "var(--a-muted)",
                          borderColor: madinahImgMode === m ? "#0ea5e9" : "var(--a-border)" }}>
                        {m === "upload" ? "📁 Upload" : "🔗 URL"}
                      </button>
                    ))}
                  </div>
                  {madinahImgMode === "upload"
                    ? <input type="file" accept="image/*" onChange={(e) => setMadinahHotelFile(e.target.files?.[0] ?? null)} />
                    : <input placeholder="https://…" value={form.madinahHotelImgUrl} onChange={(e) => setForm((f) => ({ ...f, madinahHotelImgUrl: e.target.value }))} />}
                </div>
                {/* Flight / transport specs */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Flight Type</label>
                  <input value={form.flightType} onChange={(e) => setForm((f) => ({ ...f, flightType: e.target.value }))} placeholder="e.g. Direct Flight" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Luggage</label>
                  <input value={form.luggage} onChange={(e) => setForm((f) => ({ ...f, luggage: e.target.value }))} placeholder="e.g. 30+7 / 30+7 KG" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Transport Type</label>
                  <input value={form.transportType} onChange={(e) => setForm((f) => ({ ...f, transportType: e.target.value }))} placeholder="e.g. Sharing" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>Total Seats</label>
                  <input type="number" value={form.totalSeats} onChange={(e) => setForm((f) => ({ ...f, totalSeats: e.target.value }))} placeholder="e.g. 40" />
                </div>
              </div>
            )}
          </div>

          {/* FLIGHT SECTORS — minimum 1 Departure + 1 Arrival, "-" disabled on those two.
              Hidden for Umrah packages: those use a fixed Makkah/Madinah itinerary rather
              than per-package flight sectors, and the owner asked for this field to not
              appear at all when adding an Umrah package (not just be optional). */}
          {/* FLIGHT SECTORS — Umrah always shows (departure + arrival + optional via) */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label>✈ Flight Sectors</label>
            <FlightSectorsEditor
              sectors={flightSectors}
              onChange={setFlightSectors}
              accessToken={accessToken}
            />
          </div>

                    {/* ITINERARY EDITOR */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Itinerary Steps</label>
            <div style={{ display: "grid", gap: "10px" }}>
              {itinerary.map((step, i) => (
                <div key={i} style={{ border: "1px solid var(--a-border2)", borderRadius: "8px", padding: "10px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      placeholder={`Step ${i + 1} — type or pick from library`}
                      value={step.title}
                      onChange={(e) => updateItineraryStep(i, { title: e.target.value })}
                      list={`step-lib-${i}`}
                      style={{ flex: 1 }}
                    />
                    <datalist id={`step-lib-${i}`}>
                      {librarySteps.map(s => <option key={s.id} value={s.title} />)}
                    </datalist>
                    <button type="button" onClick={() => {
                      const match = librarySteps.find(s => s.title === step.title);
                      if (match?.description) updateItineraryStep(i, { details: match.description });
                    }} className="adp-btn adp-btn-t" style={{ fontSize: 11 }} title="Auto-fill description from library">↓</button>
                    <button type="button" onClick={() => removeItineraryStep(i)} className="adp-btn adp-btn-r">Remove</button>
                  </div>
                  <textarea placeholder="Details, one bullet per line" rows={3} value={step.details}
                    onChange={(e) => updateItineraryStep(i, { details: e.target.value })} style={{ marginBottom: "6px" }} />
                  <input placeholder="Image URLs, comma-separated (optional)" value={step.images}
                    onChange={(e) => updateItineraryStep(i, { images: e.target.value })} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "8px", alignItems: "center" }}>
              <button type="button" onClick={addItineraryStep} className="adp-btn adp-btn-t">+ Add Itinerary Step</button>
              {librarySteps.length === 0 && (
                <span style={{ fontSize: 11, color: "var(--a-dim)" }}>
                  💡 <a href="/admin/umrah-steps" target="_blank" style={{ color: "var(--a-blue)" }}>Build Step Library</a> for autocomplete
                </span>
              )}
            </div>
          </div>

          {/* Room types (create mode) — fixed 4 rows. Empty price = not offered, won't be saved. */}
          {!editingId && (
            <div style={{ gridColumn: "1 / -1", background: "#f8fafc", border: "1.5px solid var(--a-border)", borderRadius: 10, padding: "16px 18px" }}>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: "block" }}>
                🛏️ Room Type Pricing — leave price blank if this room is not offered
              </label>
              <div style={{ display: "grid", gap: 10 }}>
                {(Object.keys(FIXED_ROOM_META) as FixedRoomKey[]).map((k) => {
                  const meta = FIXED_ROOM_META[k];
                  const prices = fixedRooms[k];
                  const hasPrice = Number(prices.perPerson) > 0;
                  return (
                    <div key={k} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr", gap: 8, alignItems: "end",
                      padding: "10px 12px", border: "1px solid var(--a-border)", borderRadius: 8,
                      background: hasPrice ? "#fff" : "#f1f5f9", opacity: hasPrice ? 1 : 0.7 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700 }}>{meta.label}</label>
                        {meta.optional && <span style={{ fontSize: 9, color: "var(--a-dim)", display: "block" }}>optional</span>}
                        {!hasPrice && <span style={{ fontSize: 9, color: "#94a3b8" }}>not offered</span>}
                      </div>
                      <div>
                        <label style={{ fontSize: 9 }}>Price / Person (PKR) *</label>
                        <input type="number" placeholder="e.g. 150000" value={prices.perPerson}
                          onChange={(e) => updateFixedRoom(k, { perPerson: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: 9 }}>Price / Child (PKR)</label>
                        <input type="number" placeholder="0" value={prices.perChild}
                          onChange={(e) => updateFixedRoom(k, { perChild: e.target.value })} disabled={!hasPrice} />
                      </div>
                      <div>
                        <label style={{ fontSize: 9 }}>Price / Infant (PKR)</label>
                        <input type="number" placeholder="0" value={prices.perInfant}
                          onChange={(e) => updateFixedRoom(k, { perInfant: e.target.value })} disabled={!hasPrice} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 10, color: "var(--a-dim)", marginTop: 8 }}>
                Display price on card = lowest per-person price entered above. After saving, edit individual room types below.
              </p>
            </div>
          )}

          {error && <p style={{ gridColumn: "1 / -1", color: "var(--a-red)", fontSize: "12px" }}>{error}</p>}

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">
              {submitting ? "Saving…" : editingId ? "Update Package" : "Create Package"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel / New Package</button>}
          </div>
        </form>
      </div>

      {/* ROOM TYPES — always visible so it's never a mystery that pricing
          lives here, not in the "Price (listing display)" field above. */}
      {editingPackage ? (
        <PackageRoomTypesManager
          packageId={editingPackage.id}
          roomTypes={editingPackage.roomTypes}
          accessToken={accessToken}
          refresh={refresh}
          onChange={load}
        />
      ) : (
        <div className="adp-card">
          <div className="adp-ch"><h3>Room Types &amp; Pricing</h3></div>
          <p style={{ padding: "16px 18px", fontSize: "12.5px", color: "var(--a-muted)" }}>
            Add the room basis rows above (Quad/Triple/Double/…) and click <strong>Create Package</strong> —
            they&apos;ll be saved together with the package, and you can keep editing/adding more here afterward.
          </p>
        </div>
      )}

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : packages.length === 0 ? (
            <p className="etd">No packages yet.</p>
          ) : (
            <table className="adp-table">
              <thead><tr><th>Name</th><th>Category</th><th>Slug</th><th>Rooms</th><th>Bookings</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}{p.featured ? " ★" : ""}</strong></td>
                    <td className="capitalize">{p.category}</td>
                    <td>{p.slug ?? <span style={{ color: "var(--a-dim)" }}>none</span>}</td>
                    <td>{p.roomTypes.length}</td>
                    <td style={{ fontWeight: 700, color: (p._count?.bookings ?? 0) > 0 ? "var(--a-green)" : "var(--a-dim)" }}>{p._count?.bookings ?? 0}</td>
                    <td><span className={`adp-pill adp-p-${p.status}`}>{p.status}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => startEdit(p)} className="adp-btn adp-btn-s">Edit</button>
                      <a href={`/admin/agent-bookings?packageId=${p.id}`} className="adp-btn adp-btn-s">Bookings</a>
                      <button onClick={() => handleDuplicate(p.id)} className="adp-btn" style={{ background: "var(--a-border)" }}>Duplicate</button>
                      <button onClick={() => handleDelete(p.id)} className="adp-btn adp-btn-r">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminPackagesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <PackagesInner />
      </AdminShell>
    </AdminGuard>
  );
}
