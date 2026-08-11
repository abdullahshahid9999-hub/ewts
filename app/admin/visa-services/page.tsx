"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";
import { APPLICANT_CATEGORIES } from "@/lib/visaApplicantCategory";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequiredDoc = {
  id?: string; // no id = pending (not yet saved)
  name: string;
  icon?: string | null;
  description: string | null;
  isRequired: boolean;
  applicantCategory: string | null;
  nationality: string | null;
};

type VisaService = {
  id: string; title: string; country: string; type: string;
  price: string | null; priceAdult: number | null; priceChild: number | null; priceInfant: number | null;
  days: string | null; validity: string | null; maxStay: string | null; entryType: string | null;
  status: string; termsAndConditions: string | null; refundPolicy: string | null;
  countryImage: string | null; mobileImage: string | null;
};

const emptyForm = {
  title: "", country: "", type: "tourist", price: "",
  priceAdult: "", priceChild: "", priceInfant: "",
  days: "", validity: "", maxStay: "", entryType: "", status: "active",
  termsAndConditions: "", refundPolicy: "",
};

const emptyDoc = { name: "", icon: "", description: "", isRequired: true, applicantCategory: "", nationality: "" };

const iStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" };

const TYPE_LABELS: Record<string, string> = { tourist: "Tourist", umrah: "Umrah", business: "Business", work: "Work" };
const ENTRY_LABELS: Record<string, string> = { single: "Single Entry", multiple: "Multiple Entry", transit: "Transit" };

// ─── Section header inside form ───────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div style={{ borderTop: "1px solid var(--a-border2)", paddingTop: 14, marginTop: 4, marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function VisaServicesInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [items, setItems] = useState<VisaService[]>([]);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // null = creating new
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Docs — inline in the form (pending = not yet saved, used during create)
  const [pendingDocs, setPendingDocs] = useState<RequiredDoc[]>([]);   // for create
  const [savedDocs, setSavedDocs] = useState<RequiredDoc[]>([]);       // for edit (already in DB)
  const [newDoc, setNewDoc] = useState(emptyDoc);
  const [savingDoc, setSavingDoc] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<string | null>(null); // which card's docs are open

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/visa-services");
    const data = await res.json().catch(() => ({}));
    const services: VisaService[] = data.visaServices ?? [];
    setItems(services);
    setLoading(false);
    // Fetch doc counts in parallel
    const counts = await Promise.all(
      services.map(async (v) => {
        const r = await adminFetch(`/api/admin/visa-services/${v.id}/documents`, accessToken, refresh);
        const d = await r.json().catch(() => ({}));
        return [v.id, (d.docs ?? []).length] as const;
      })
    );
    setDocCounts(Object.fromEntries(counts));
  }, [accessToken, refresh]);

  const loadSavedDocs = useCallback(async (visaId: string) => {
    const r = await adminFetch(`/api/admin/visa-services/${visaId}/documents`, accessToken, refresh);
    const d = await r.json().catch(() => ({}));
    setSavedDocs(d.docs ?? []);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingId(null); setForm(emptyForm);
    setDesktopFile(null); setMobileFile(null);
    setPendingDocs([]); setSavedDocs([]);
    setNewDoc(emptyDoc); setError(null); setShowForm(true);
    setTimeout(() => document.getElementById("visa-form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function openEdit(v: VisaService) {
    setEditingId(v.id);
    setForm({
      title: v.title, country: v.country, type: v.type, price: v.price ?? "",
      priceAdult: v.priceAdult != null ? String(v.priceAdult) : "",
      priceChild: v.priceChild != null ? String(v.priceChild) : "",
      priceInfant: v.priceInfant != null ? String(v.priceInfant) : "",
      days: v.days ?? "", validity: v.validity ?? "",
      maxStay: v.maxStay ?? "", entryType: v.entryType ?? "",
      status: v.status,
      termsAndConditions: v.termsAndConditions ?? "",
      refundPolicy: v.refundPolicy ?? "",
    });
    setDesktopFile(null); setMobileFile(null);
    setPendingDocs([]); setNewDoc(emptyDoc); setError(null);
    setShowForm(true);
    loadSavedDocs(v.id);
    setTimeout(() => document.getElementById("visa-form-top")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function cancelForm() { setShowForm(false); setEditingId(null); setError(null); setPendingDocs([]); setSavedDocs([]); }

  // ── Add doc to pending list (create mode) ──
  function addPendingDoc() {
    if (!newDoc.name.trim()) return;
    setPendingDocs(prev => [...prev, {
      name: newDoc.name.trim(), icon: newDoc.icon.trim() || null, description: newDoc.description.trim() || null,
      isRequired: newDoc.isRequired,
      applicantCategory: newDoc.applicantCategory || null,
      nationality: newDoc.nationality.trim() || null,
    }]);
    setNewDoc(emptyDoc);
  }

  // ── Add doc directly to DB (edit mode) ──
  async function addSavedDoc() {
    if (!editingId || !newDoc.name.trim()) return;
    setSavingDoc(true);
    await adminFetch(`/api/admin/visa-services/${editingId}/documents`, accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDoc.name.trim(), icon: newDoc.icon.trim() || null, description: newDoc.description.trim() || null, isRequired: newDoc.isRequired, applicantCategory: newDoc.applicantCategory || null, nationality: newDoc.nationality.trim() || null }),
    });
    setSavingDoc(false);
    setNewDoc(emptyDoc);
    loadSavedDocs(editingId);
  }

  async function deleteSavedDoc(docId: string) {
    if (!editingId) return;
    await adminFetch(`/api/admin/visa-services/${editingId}/documents/${docId}`, accessToken, refresh, { method: "DELETE" });
    loadSavedDocs(editingId);
  }

  async function toggleSavedDocRequired(doc: RequiredDoc & { id: string }) {
    if (!editingId) return;
    await adminFetch(`/api/admin/visa-services/${editingId}/documents/${doc.id}`, accessToken, refresh, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRequired: !doc.isRequired }),
    });
    loadSavedDocs(editingId);
  }

  // ── Submit main form ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.country.trim()) { setError("Title and country are required."); return; }
    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.set(k, v));
    if (desktopFile) body.set("countryImage", await compressImage(desktopFile));
    if (mobileFile) body.set("mobileImage", await compressImage(mobileFile));

    const url = editingId ? `/api/admin/visa-services/${editingId}` : "/api/admin/visa-services";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save."); return; }

    // On create: save all pending docs
    const newId: string = editingId ?? data.visaService?.id;
    if (!editingId && pendingDocs.length > 0 && newId) {
      await Promise.all(pendingDocs.map(doc =>
        adminFetch(`/api/admin/visa-services/${newId}/documents`, accessToken, refresh, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        })
      ));
    }

    cancelForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this visa service?")) return;
    await adminFetch(`/api/admin/visa-services/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  // ── Doc input row (shared between create/edit) ──
  const docInputRow = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginTop: 10 }}>
      <div style={{ flex: "0 0 72px" }}>
        <input style={{ ...iStyle, textAlign: "center", fontSize: 20 }} placeholder="📄" value={newDoc.icon}
          onChange={e => setNewDoc(f => ({ ...f, icon: e.target.value }))} maxLength={4} title="Emoji icon (e.g. 🛂 📄 📸)" />
      </div>
      <div style={{ flex: "2 1 160px" }}><input style={iStyle} placeholder="Document name*" value={newDoc.name} onChange={e => setNewDoc(f => ({ ...f, name: e.target.value }))} /></div>
      <div style={{ flex: "2 1 160px" }}><input style={iStyle} placeholder="Description (optional)" value={newDoc.description} onChange={e => setNewDoc(f => ({ ...f, description: e.target.value }))} /></div>
      <div style={{ flex: "1 1 130px" }}>
        <select style={iStyle} value={newDoc.applicantCategory} onChange={e => setNewDoc(f => ({ ...f, applicantCategory: e.target.value }))}>
          <option value="">All Categories</option>
          {APPLICANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div style={{ flex: "1 1 100px" }}><input style={iStyle} placeholder="Nationality (optional)" value={newDoc.nationality} onChange={e => setNewDoc(f => ({ ...f, nationality: e.target.value }))} /></div>
      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer" }}>
        <input type="checkbox" checked={newDoc.isRequired} onChange={e => setNewDoc(f => ({ ...f, isRequired: e.target.checked }))} style={{ accentColor: "var(--a-gold)" }} /> Required
      </label>
      <button type="button" onClick={editingId ? addSavedDoc : addPendingDoc} disabled={savingDoc} className="adp-btn adp-btn-g" style={{ whiteSpace: "nowrap" }}>
        {savingDoc ? "Adding…" : "+ Add Doc"}
      </button>
    </div>
  );

  const docList = (docs: RequiredDoc[], onDelete?: (id: string) => void, onToggle?: (doc: RequiredDoc & { id: string }) => void) => (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {docs.map((d, i) => (
        <div key={d.id ?? i} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid var(--a-border)", borderRadius: 8, padding: "8px 12px" }}>
          <span style={{ fontSize: 13, flex: 1 }}><span style={{ marginRight: 6 }}>{d.icon || "📄"}</span>{d.name}{d.description ? <span style={{ opacity: 0.5, fontSize: 11, marginLeft: 6 }}>— {d.description}</span> : null}</span>
          {d.applicantCategory && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid var(--a-border)" }}>{d.applicantCategory}</span>}
          {d.nationality && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid var(--a-border)" }}>{d.nationality}</span>}
          <span style={{ fontSize: 11, fontWeight: 600, color: d.isRequired ? "var(--a-red)" : "var(--a-muted)", cursor: onToggle ? "pointer" : "default" }}
            onClick={() => onToggle && d.id && onToggle(d as RequiredDoc & { id: string })}>
            {d.isRequired ? "Required" : "Optional"}
          </span>
          {onDelete && d.id && <button type="button" onClick={() => onDelete(d.id!)} className="adp-btn adp-btn-r" style={{ fontSize: 11, padding: "2px 8px" }}>✕</button>}
          {!d.id && <button type="button" onClick={() => setPendingDocs(prev => prev.filter((_, j) => j !== i))} className="adp-btn adp-btn-r" style={{ fontSize: 11, padding: "2px 8px" }}>✕</button>}
        </div>
      ))}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (<>
    <div className="adp-ph">
      <div><h2>Visa <em>Services</em></h2><p>Manage visa listings, pricing, required documents, and images</p></div>
      <button className="adp-btn adp-btn-g" onClick={openCreate}>+ New Visa Service</button>
    </div>

    {/* ── CREATE / EDIT FORM ── */}
    {showForm && (
      <div className="adp-card" style={{ marginBottom: 20 }} id="visa-form-top">
        <div className="adp-ch">
          <h3>{editingId ? "Edit Visa Service" : "Create New Visa Service"}</h3>
          <button type="button" className="adp-btn adp-btn-t" onClick={cancelForm}>Cancel</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "16px 18px" }}>

          {/* ── Basic Info ── */}
          <Divider label="Basic Info" />
          <div className="adp-fg adp-fr" style={{ marginBottom: 14 }}>
            <div><label>Title *</label><input required style={iStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. UAE Tourist Visa" /></div>
            <div><label>Country *</label><input required style={iStyle} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. UAE" /></div>
            <div>
              <label>Visa Type</label>
              <select style={iStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="tourist">Tourist</option>
                <option value="umrah">Umrah</option>
                <option value="business">Business</option>
                <option value="work">Work</option>
              </select>
            </div>
            <div>
              <label>Status</label>
              <select style={iStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* ── Visa Details ── */}
          <Divider label="Visa Details" />
          <div className="adp-fg adp-fr" style={{ marginBottom: 14 }}>
            <div><label>Processing Days</label><input style={iStyle} value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} placeholder="e.g. 8–10 Working Days" /></div>
            <div><label>Validity</label><input style={iStyle} value={form.validity} onChange={e => setForm(f => ({ ...f, validity: e.target.value }))} placeholder="e.g. 60 Days" /></div>
            <div><label>Period of Stay</label><input style={iStyle} value={form.maxStay} onChange={e => setForm(f => ({ ...f, maxStay: e.target.value }))} placeholder="e.g. 30 Days" /></div>
            <div>
              <label>Entry Type</label>
              <select style={iStyle} value={form.entryType} onChange={e => setForm(f => ({ ...f, entryType: e.target.value }))}>
                <option value="">— Select —</option>
                <option value="single">Single Entry</option>
                <option value="multiple">Multiple Entry</option>
                <option value="transit">Transit</option>
              </select>
            </div>
          </div>

          {/* ── Pricing ── */}
          <Divider label="Pricing (PKR) — Adult / Child / Infant" />
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Legacy Display</label>
              <input style={iStyle} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. PKR 12,000" />
              <div style={{ fontSize: 9, color: "var(--a-muted)", marginTop: 3 }}>Shown if no numeric price</div>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Adult (PKR)</label>
              <input type="number" min={0} style={iStyle} value={form.priceAdult} onChange={e => setForm(f => ({ ...f, priceAdult: e.target.value }))} placeholder="e.g. 15000" />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Child (PKR)</label>
              <input type="number" min={0} style={iStyle} value={form.priceChild} onChange={e => setForm(f => ({ ...f, priceChild: e.target.value }))} placeholder="e.g. 10000" />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Infant (PKR)</label>
              <input type="number" min={0} style={iStyle} value={form.priceInfant} onChange={e => setForm(f => ({ ...f, priceInfant: e.target.value }))} placeholder="e.g. 5000" />
            </div>
          </div>

          {/* ── Images ── */}
          <Divider label="Images" />
          <div className="adp-fg adp-fr" style={{ marginBottom: 14 }}>
            <div>
              <label>Desktop / Hero Image <span style={{ fontSize: 11, opacity: 0.5 }}>(landscape, 1200×600 ideal)</span></label>
              <input type="file" accept="image/*" onChange={e => setDesktopFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12 }} />
              {items.find(v => v.id === editingId)?.countryImage && !desktopFile && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={items.find(v => v.id === editingId)!.countryImage!} alt="" style={{ marginTop: 6, height: 60, borderRadius: 6, objectFit: "cover" }} />
              )}
            </div>
            <div>
              <label>Mobile Image <span style={{ fontSize: 11, opacity: 0.5 }}>(portrait, 600×800 ideal)</span></label>
              <input type="file" accept="image/*" onChange={e => setMobileFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12 }} />
              {items.find(v => v.id === editingId)?.mobileImage && !mobileFile && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={items.find(v => v.id === editingId)!.mobileImage!} alt="" style={{ marginTop: 6, height: 60, borderRadius: 6, objectFit: "cover" }} />
              )}
            </div>
          </div>

          {/* ── Required Documents ── */}
          <Divider label="Required Documents" />
          <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 10 }}>
            Add the documents applicants need to provide. You can scope each doc to a specific applicant category or nationality — leave blank for all applicants.
          </p>
          {editingId
            ? docList(savedDocs, deleteSavedDoc, toggleSavedDocRequired)
            : docList(pendingDocs)}
          {(editingId ? savedDocs : pendingDocs).length === 0 && (
            <p style={{ fontSize: 12, opacity: 0.4, marginBottom: 4 }}>No documents added yet.</p>
          )}
          {docInputRow}

          {/* ── Terms & Refund ── */}
          <Divider label="Terms & Conditions / Refund Policy" />
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Terms &amp; Conditions</label>
              <textarea rows={5} style={{ ...iStyle, resize: "vertical" }} value={form.termsAndConditions} onChange={e => setForm(f => ({ ...f, termsAndConditions: e.target.value }))} placeholder="e.g. Visa approval is subject to embassy decision..." />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Refund &amp; Cancellation Policy</label>
              <textarea rows={5} style={{ ...iStyle, resize: "vertical" }} value={form.refundPolicy} onChange={e => setForm(f => ({ ...f, refundPolicy: e.target.value }))} placeholder="e.g. Service fee is non-refundable once processing starts..." />
            </div>
          </div>

          {error && <p style={{ color: "var(--a-red)", fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">{submitting ? "Saving…" : editingId ? "Update Visa" : "Create Visa"}</button>
            <button type="button" onClick={cancelForm} className="adp-btn adp-btn-t">Cancel</button>
          </div>
        </form>
      </div>
    )}

    {/* ── VISA LISTING — CARD GRID ── */}
    {loading ? <p className="etd">Loading…</p> : items.length === 0 ? (
      <div className="adp-card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
        <p style={{ opacity: 0.5, marginBottom: 16 }}>No visa services yet. Create your first one above.</p>
        <button className="adp-btn adp-btn-g" onClick={openCreate}>+ New Visa Service</button>
      </div>
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {items.map(v => (
          <div key={v.id} style={{ background: "var(--a-card-bg, var(--a-surface))", border: "1px solid var(--a-border)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Card hero image */}
            <div style={{ position: "relative", height: 140, background: "var(--a-surface-2, rgba(255,255,255,0.04))", overflow: "hidden" }}>
              {v.countryImage
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={v.countryImage} alt={v.country} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 40, opacity: 0.2 }}>🌍</div>}
              {/* Mobile image badge */}
              {v.mobileImage && (
                <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.65)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                  📱 Mobile img
                </div>
              )}
              {/* Status pill */}
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <span className={`adp-pill adp-p-${v.status}`}>{v.status}</span>
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{v.title}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{v.country}</div>
              </div>

              {/* Badges row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid var(--a-border)" }}>{TYPE_LABELS[v.type] ?? v.type}</span>
                {v.entryType && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid var(--a-border)" }}>{ENTRY_LABELS[v.entryType] ?? v.entryType}</span>}
                {v.maxStay && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid var(--a-border)" }}>Stay: {v.maxStay}</span>}
                {v.validity && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid var(--a-border)" }}>Valid: {v.validity}</span>}
              </div>

              {/* Price + processing */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  {v.priceAdult != null
                    ? <span style={{ fontWeight: 700, color: "var(--a-gold)" }}>PKR {v.priceAdult.toLocaleString()}<span style={{ fontWeight: 400, fontSize: 11, opacity: 0.6 }}>/adult</span></span>
                    : v.price ? <span style={{ fontWeight: 600, color: "var(--a-gold)" }}>{v.price}</span>
                    : <span style={{ opacity: 0.35, fontSize: 12 }}>Price not set</span>}
                </div>
                {v.days && <span style={{ fontSize: 11, opacity: 0.6 }}>⏱ {v.days}</span>}
              </div>

              {/* Required docs toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedDocs(expandedDocs === v.id ? null : v.id)}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", background: "none", border: "none", color: "inherit", padding: 0, fontWeight: 500 }}
                >
                  <span style={{ color: docCounts[v.id] > 0 ? "var(--a-gold)" : "var(--a-red)", fontWeight: 700 }}>{docCounts[v.id] ?? "…"}</span>
                  required doc{docCounts[v.id] !== 1 ? "s" : ""}
                  {docCounts[v.id] === 0 && <span style={{ color: "var(--a-red)", fontSize: 10 }}>⚠ none</span>}
                  <span style={{ opacity: 0.5 }}>{expandedDocs === v.id ? "▲" : "▼"}</span>
                </button>
                {expandedDocs === v.id && <DocsMiniPanel visaId={v.id} accessToken={accessToken} refresh={refresh} />}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--a-border)", display: "flex", gap: 8 }}>
              <button onClick={() => openEdit(v)} className="adp-btn adp-btn-s" style={{ flex: 1 }}>Edit</button>
              <button onClick={() => handleDelete(v.id)} className="adp-btn adp-btn-r">Delete</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </>);
}

// ─── Mini docs panel shown inline in the listing card ──────────────────────
function DocsMiniPanel({ visaId, accessToken, refresh }: { visaId: string; accessToken: string | null; refresh: () => Promise<string | null> }) {
  const [docs, setDocs] = useState<RequiredDoc[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminFetch(`/api/admin/visa-services/${visaId}/documents`, accessToken, refresh)
      .then(r => r.json()).then(d => { setDocs(d.docs ?? []); setLoaded(true); }).catch(() => setLoaded(true));
  }, [visaId, accessToken, refresh]);

  if (!loaded) return <p style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>Loading…</p>;
  if (docs.length === 0) return <p style={{ fontSize: 11, opacity: 0.45, marginTop: 6 }}>No documents configured. Edit this visa to add them.</p>;

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
      {docs.map((d, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <span style={{ color: d.isRequired ? "var(--a-red)" : "var(--a-muted)", fontSize: 10, minWidth: 50 }}>{d.isRequired ? "Required" : "Optional"}</span>
          <span>{d.name}</span>
          {d.applicantCategory && <span style={{ fontSize: 10, opacity: 0.5 }}>({d.applicantCategory})</span>}
        </div>
      ))}
    </div>
  );
}

export default function AdminVisaServicesPage() {
  return <AdminGuard><AdminShell><VisaServicesInner /></AdminShell></AdminGuard>;
}
