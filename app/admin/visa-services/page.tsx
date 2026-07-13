"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type RequiredDoc = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  sortOrder: number;
};

type VisaService = {
  id: string;
  title: string;
  country: string;
  type: string;
  price: string | null;
  priceAdult: number | null;
  priceChild: number | null;
  priceInfant: number | null;
  days: string | null;
  status: string;
  termsAndConditions: string | null;
  refundPolicy: string | null;
};

const emptyForm = {
  title: "", country: "", type: "tourist", price: "",
  priceAdult: "", priceChild: "", priceInfant: "",
  days: "", validity: "", status: "active",
  termsAndConditions: "", refundPolicy: "",
};

function VisaServicesInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [items, setItems] = useState<VisaService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Required documents for the currently-editing visa
  const [docsForId, setDocsForId] = useState<string | null>(null);
  const [docs, setDocs] = useState<RequiredDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", description: "", isRequired: true });
  const [savingDoc, setSavingDoc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/visa-services");
    const data = await res.json().catch(() => ({}));
    setItems(data.visaServices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadDocs(visaId: string) {
    setLoadingDocs(true);
    setDocsForId(visaId);
    const res = await adminFetch(`/api/admin/visa-services/${visaId}/documents`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setDocs(data.docs ?? []);
    setLoadingDocs(false);
  }

  function resetForm() { setEditingId(null); setForm(emptyForm); setFile(null); setError(null); setDocsForId(null); setDocs([]); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.country.trim()) { setError("Title and country are required."); return; }
    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.set(k, v));
    if (file) body.set("countryImage", await compressImage(file));

    const url = editingId ? `/api/admin/visa-services/${editingId}` : "/api/admin/visa-services";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save."); return; }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this visa service? All associated applications will remain but the visa will be removed.")) return;
    await adminFetch(`/api/admin/visa-services/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  async function addDoc() {
    if (!docsForId || !newDoc.name.trim()) return;
    setSavingDoc(true);
    const res = await adminFetch(`/api/admin/visa-services/${docsForId}/documents`, accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDoc.name.trim(), description: newDoc.description.trim() || null, isRequired: newDoc.isRequired }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingDoc(false);
    if (!res.ok) { setError(data.error ?? "Could not add document."); return; }
    setNewDoc({ name: "", description: "", isRequired: true });
    loadDocs(docsForId);
  }

  async function deleteDoc(docId: string) {
    if (!docsForId) return;
    await adminFetch(`/api/admin/visa-services/${docsForId}/documents/${docId}`, accessToken, refresh, { method: "DELETE" });
    loadDocs(docsForId);
  }

  async function toggleDocRequired(doc: RequiredDoc) {
    if (!docsForId) return;
    await adminFetch(`/api/admin/visa-services/${docsForId}/documents/${doc.id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRequired: !doc.isRequired }),
    });
    loadDocs(docsForId);
  }

  const iStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px", border: "1.5px solid var(--a-border)", borderRadius: 7, fontSize: 12, outline: "none",
  };

  return (
    <>
      <div className="adp-ph">
        <div><h2>Visa <em>Services</em></h2><p>Manage visa listings, pricing, and required document checklists</p></div>
      </div>

      {/* ── Create / Edit form ── */}
      <div className="adp-card" style={{ marginBottom: 20 }}>
        <div className="adp-ch"><h3>{editingId ? "Edit Visa Service" : "New Visa Service"}</h3></div>
        <form onSubmit={handleSubmit} style={{ padding: "16px 18px" }}>
          <div className="adp-fg adp-fr" style={{ marginBottom: 14 }}>
            <div><label>Title</label><input required style={iStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. UAE Tourist Visa" /></div>
            <div><label>Country</label><input required style={iStyle} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="e.g. UAE" /></div>
            <div>
              <label>Type</label>
              <select style={iStyle} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="tourist">Tourist</option>
                <option value="umrah">Umrah</option>
                <option value="business">Business</option>
                <option value="work">Work</option>
              </select>
            </div>
            <div><label>Processing Days</label><input style={iStyle} value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))} placeholder="e.g. 7–10 days" /></div>
            <div><label>Validity</label><input style={iStyle} value={form.validity} onChange={(e) => setForm((f) => ({ ...f, validity: e.target.value }))} placeholder="e.g. 30 days" /></div>
            <div>
              <label>Status</label>
              <select style={iStyle} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div><label>Country Image</label><input type="file" accept="image/*" style={{ fontSize: 12 }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          </div>

          {/* Age-tiered pricing section */}
          <div style={{ borderTop: "1px solid var(--a-border2)", paddingTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Pricing (PKR) — Adult / Child / Infant
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Legacy Price Display</label>
                <input style={iStyle} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="e.g. PKR 12,000" />
                <div style={{ fontSize: 9, color: "var(--a-muted)", marginTop: 3 }}>Shown on card if no numeric price set</div>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Adult (PKR)</label>
                <input type="number" min={0} style={iStyle} value={form.priceAdult} onChange={(e) => setForm((f) => ({ ...f, priceAdult: e.target.value }))} placeholder="e.g. 15000" />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Child (PKR)</label>
                <input type="number" min={0} style={iStyle} value={form.priceChild} onChange={(e) => setForm((f) => ({ ...f, priceChild: e.target.value }))} placeholder="e.g. 10000" />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Infant (PKR)</label>
                <input type="number" min={0} style={iStyle} value={form.priceInfant} onChange={(e) => setForm((f) => ({ ...f, priceInfant: e.target.value }))} placeholder="e.g. 5000" />
              </div>
            </div>
          </div>

          {error && <p style={{ color: "var(--a-red)", fontSize: "12px", marginBottom: 10 }}>{error}</p>}

          {/* Terms & Conditions + Refund Policy */}
          <div style={{ borderTop: "1px solid var(--a-border2)", paddingTop: 14, marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                Terms &amp; Conditions
              </label>
              <textarea
                rows={6}
                style={{ ...iStyle, resize: "vertical" }}
                value={form.termsAndConditions}
                onChange={(e) => setForm((f) => ({ ...f, termsAndConditions: e.target.value }))}
                placeholder="e.g. Visa approval is subject to embassy decision. East & West Travel is not responsible for visa rejections..."
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                Refund &amp; Cancellation Policy
              </label>
              <textarea
                rows={6}
                style={{ ...iStyle, resize: "vertical" }}
                value={form.refundPolicy}
                onChange={(e) => setForm((f) => ({ ...f, refundPolicy: e.target.value }))}
                placeholder="e.g. Service fee is non-refundable once processing has started. Embassy fee refundable only if visa is rejected..."
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">{submitting ? "Saving…" : editingId ? "Update Visa" : "Create Visa"}</button>
            {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel</button>}
          </div>
        </form>

        {/* Required Documents sub-panel — only shows when editing an existing visa */}
        {editingId && (
          <div style={{ borderTop: "1px solid var(--a-border2)", padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Required Documents Checklist</div>
                <div style={{ fontSize: 11, color: "var(--a-muted)" }}>
                  {docsForId === editingId
                    ? "Manage which documents applicants must upload for this visa"
                    : "Load the document checklist for this visa"}
                </div>
              </div>
              {docsForId !== editingId && (
                <button onClick={() => loadDocs(editingId)} className="adp-btn adp-btn-s">
                  Load Documents
                </button>
              )}
            </div>

            {docsForId === editingId && (
              <>
                {loadingDocs ? (
                  <p style={{ fontSize: 12, color: "var(--a-muted)" }}>Loading…</p>
                ) : (
                  <>
                    {/* Existing documents */}
                    {docs.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                        {docs.map((doc) => (
                          <div key={doc.id} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            background: "var(--a-surface)", border: "1px solid var(--a-border2)",
                            borderRadius: 8, padding: "8px 12px",
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{doc.name}</div>
                              {doc.description && <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{doc.description}</div>}
                            </div>
                            <button
                              onClick={() => toggleDocRequired(doc)}
                              className="adp-btn adp-btn-s"
                              style={{ fontSize: 10, whiteSpace: "nowrap" }}
                            >
                              {doc.isRequired ? "Required" : "Optional"}
                            </button>
                            <button onClick={() => deleteDoc(doc.id)} className="adp-btn adp-btn-r adp-btn-s" style={{ fontSize: 10 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new document row */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr auto auto", gap: 8, alignItems: "end" }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 3 }}>Document Name</label>
                        <input
                          style={iStyle}
                          value={newDoc.name}
                          onChange={(e) => setNewDoc((d) => ({ ...d, name: e.target.value }))}
                          placeholder="e.g. Passport Scan"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc())}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 3 }}>Instruction (optional)</label>
                        <input
                          style={iStyle}
                          value={newDoc.description}
                          onChange={(e) => setNewDoc((d) => ({ ...d, description: e.target.value }))}
                          placeholder="e.g. Clear scan of all pages"
                        />
                      </div>
                      <div style={{ paddingBottom: 0 }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 3 }}>Required?</label>
                        <select
                          style={{ ...iStyle, width: "auto" }}
                          value={newDoc.isRequired ? "yes" : "no"}
                          onChange={(e) => setNewDoc((d) => ({ ...d, isRequired: e.target.value === "yes" }))}
                        >
                          <option value="yes">Required</option>
                          <option value="no">Optional</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        disabled={savingDoc || !newDoc.name.trim()}
                        onClick={addDoc}
                        className="adp-btn adp-btn-g"
                        style={{ alignSelf: "end" }}
                      >
                        {savingDoc ? "…" : "+ Add"}
                      </button>
                    </div>

                    {docs.length === 0 && (
                      <p style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 8 }}>
                        No documents added yet. Use the form above to add required documents for this visa.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Visa list table ── */}
      <div className="adp-card">
        <div className="adp-tw">
          {loading ? <p className="etd">Loading…</p> : items.length === 0 ? <p className="etd">No visa services yet.</p> : (
            <table className="adp-table">
              <thead>
                <tr><th>Title</th><th>Country</th><th>Type</th><th>Adult Price</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.title}</strong></td>
                    <td>{v.country}</td>
                    <td style={{ textTransform: "capitalize" }}>{v.type}</td>
                    <td>
                      {v.priceAdult != null
                        ? `PKR ${v.priceAdult.toLocaleString()}`
                        : v.price ?? <span style={{ color: "var(--a-muted)" }}>—</span>}
                    </td>
                    <td><span className={`adp-pill adp-p-${v.status}`}>{v.status}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => {
                          setEditingId(v.id);
                          setForm({
                            title: v.title, country: v.country, type: v.type,
                            price: v.price ?? "",
                            priceAdult: v.priceAdult != null ? String(v.priceAdult) : "",
                            priceChild: v.priceChild != null ? String(v.priceChild) : "",
                            priceInfant: v.priceInfant != null ? String(v.priceInfant) : "",
                            days: v.days ?? "", validity: "", status: v.status,
                            termsAndConditions: v.termsAndConditions ?? "",
                            refundPolicy: v.refundPolicy ?? "",
                          });
                          setFile(null);
                          setDocsForId(null);
                          setDocs([]);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="adp-btn adp-btn-s"
                      >Edit</button>
                      <button onClick={() => handleDelete(v.id)} className="adp-btn adp-btn-r">Delete</button>
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

export default function AdminVisaServicesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <VisaServicesInner />
      </AdminShell>
    </AdminGuard>
  );
}
