"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type CommissionRate = { id: string; serviceType: string; rateType: string; value: number };
type Agent = { id: string; agentCode: string; fullName: string; email: string; phone: string | null; balance: number; creditLimit: number; tier: string; status: string; commissionRates: CommissionRate[] };
type Perm = "canCreateBookings"|"canViewBookings"|"canSubmitPaymentSlip"|"canViewLedger"|"canManageSavedClients"|"canViewNotifications";
type SubUser = { id: string; fullName: string; email: string; phone: string|null; designation: string|null; status: string; permissions: Record<Perm,boolean> };

const PERM_LABELS: Record<Perm, { label: string; desc: string }> = {
  canCreateBookings:     { label: "Create Bookings",       desc: "Umrah, Tours, Flights, Visa, Insurance book kar sake" },
  canViewBookings:       { label: "View Bookings",         desc: "Agency ki saari bookings dekh sake" },
  canSubmitPaymentSlip:  { label: "Submit Payment Slips",  desc: "Top-up / payment slip submit kar sake" },
  canViewLedger:         { label: "View Ledger & Balance", desc: "Agency ka balance aur transactions dekh sake" },
  canManageSavedClients: { label: "Manage Saved Clients",  desc: "Client profiles add / edit / delete kar sake" },
  canViewNotifications:  { label: "View Notifications",    desc: "Agency ki notifications dekh sake" },
};
const DEFAULT_PERMS: Record<Perm,boolean> = { canCreateBookings:true, canViewBookings:true, canSubmitPaymentSlip:true, canViewLedger:true, canManageSavedClients:true, canViewNotifications:true };
const SERVICE_TYPES = ["umrah","group_ticket","insurance","world_tour","visa_services"];
const SVC_LABEL: Record<string,string> = { umrah:"Umrah", group_ticket:"Group Ticket", insurance:"Insurance", world_tour:"World Tour", visa_services:"Visa Services" };

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="adp-card" style={{ marginBottom: 16 }}>
      <div className="adp-ch"><div><h3 style={{ margin:0 }}>{title}</h3>{sub && <p style={{ margin:"2px 0 0", fontSize:12, opacity:0.6 }}>{sub}</p>}</div></div>
      <div style={{ padding:"16px 18px" }}>{children}</div>
    </div>
  );
}

function PermToggle({ perms, setPerms }: { perms: Record<Perm,boolean>; setPerms: (p: Record<Perm,boolean>) => void }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:10 }}>
      {(Object.keys(PERM_LABELS) as Perm[]).map(k => (
        <label key={k} style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
          <input type="checkbox" checked={!!perms[k]} onChange={e => setPerms({ ...perms, [k]: e.target.checked })} style={{ marginTop:3, accentColor:"var(--a-gold)" }} />
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>{PERM_LABELS[k].label}</div>
            <div style={{ fontSize:11, opacity:0.55 }}>{PERM_LABELS[k].desc}</div>
          </div>
        </label>
      ))}
      <div style={{ gridColumn:"1/-1", fontSize:11, opacity:0.45, marginTop:2 }}>⚠ Issue Tickets — sirf agency owner (main login) kar sakta hai. Sub-users ke liye hamesha OFF.</div>
    </div>
  );
}

function EditAgentInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [agent, setAgent] = useState<Agent|null>(null);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean }|null>(null);
  const [form, setForm] = useState({ fullName:"", phone:"", balance:"", creditLimit:"", tier:"", status:"" });
  const [rateForm, setRateForm] = useState({ serviceType:"umrah", rateType:"percentage", value:"" });
  const [showNew, setShowNew] = useState(false);
  const [newU, setNewU] = useState({ fullName:"", email:"", phone:"", designation:"", password:"" });
  const [newPerms, setNewPerms] = useState<Record<Perm,boolean>>({ ...DEFAULT_PERMS });
  const [savingU, setSavingU] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [editPerms, setEditPerms] = useState<Record<Perm,boolean>>({ ...DEFAULT_PERMS });
  const [editStatus, setEditStatus] = useState("active");

  const flash = (text: string, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const loadSubs = useCallback(async () => {
    const res = await adminFetch(`/api/admin/agents/${id}/sub-users`, accessToken, refresh);
    const d = await res.json().catch(() => ({}));
    setSubUsers(d.subUsers ?? []);
  }, [id, accessToken, refresh]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/agents", accessToken, refresh);
    const d = await res.json().catch(() => ({}));
    const a: Agent|undefined = (d.agents ?? []).find((x: Agent) => x.id === id);
    if (a) { setAgent(a); setForm({ fullName:a.fullName, phone:a.phone??"", balance:String(a.balance), creditLimit:String(a.creditLimit), tier:a.tier, status:a.status }); }
    setLoading(false);
    loadSubs();
  }, [id, accessToken, refresh, loadSubs]);

  useEffect(() => { load(); }, [load]);

  async function saveAgent(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await adminFetch(`/api/admin/agents/${id}`, accessToken, refresh, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ fullName:form.fullName, phone:form.phone, balance:Number(form.balance), creditLimit:Number(form.creditLimit), tier:form.tier, status:form.status }) });
    setSaving(false);
    res.ok ? flash("Saved ✓") : flash((await res.json().catch(()=>({}))).error ?? "Error", false);
    if (res.ok) load();
  }

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    if (!rateForm.value) return;
    const res = await adminFetch(`/api/admin/agents/${id}/commission-rates`, accessToken, refresh, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ serviceType:rateForm.serviceType, rateType:rateForm.rateType, value:Number(rateForm.value) }) });
    res.ok ? (flash("Rate saved ✓"), setRateForm(f=>({...f,value:""})), load()) : flash((await res.json().catch(()=>({}))).error ?? "Error", false);
  }

  async function createSub(e: React.FormEvent) {
    e.preventDefault(); setSavingU(true);
    const res = await adminFetch(`/api/admin/agents/${id}/sub-users`, accessToken, refresh, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...newU, permissions:newPerms }) });
    setSavingU(false);
    if (res.ok) { flash("Staff member created ✓"); setNewU({ fullName:"", email:"", phone:"", designation:"", password:"" }); setNewPerms({...DEFAULT_PERMS}); setShowNew(false); loadSubs(); }
    else flash((await res.json().catch(()=>({}))).error ?? "Error", false);
  }

  async function toggleSub(u: SubUser) {
    const next = u.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !confirm(`Deactivate ${u.fullName}?`)) return;
    await adminFetch(`/api/admin/agents/${id}/sub-users/${u.id}`, accessToken, refresh, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status:next }) });
    loadSubs();
  }

  async function saveSub(userId: string) {
    const res = await adminFetch(`/api/admin/agents/${id}/sub-users/${userId}`, accessToken, refresh, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ permissions:editPerms, status:editStatus }) });
    res.ok ? (flash("Updated ✓"), setEditId(null), loadSubs()) : flash((await res.json().catch(()=>({}))).error ?? "Error", false);
  }

  async function deleteSub(u: SubUser) {
    if (!confirm(`Permanently delete ${u.fullName}?`)) return;
    await adminFetch(`/api/admin/agents/${id}/sub-users/${u.id}`, accessToken, refresh, { method:"DELETE" });
    loadSubs();
  }

  if (loading) return <p className="etd">Loading…</p>;
  if (!agent) return <p className="etd">Agent not found.</p>;

  return (<>
    <div className="adp-ph">
      <div><h2>Edit <em>{agent.agentCode}</em></h2><p>{agent.fullName} · <span className={`adp-pill adp-p-${agent.status}`}>{agent.status}</span></p></div>
      <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration:"none" }}>← Back</Link>
    </div>

    {msg && <p style={{ color: msg.ok ? "var(--a-green)" : "var(--a-red)", fontSize:12, marginBottom:12 }}>{msg.text}</p>}

    {/* 1. Agency Info */}
    <Card title="Agency Info" sub="Name, contact, tier, account status">
      <form onSubmit={saveAgent} className="adp-fg adp-fr">
        <div><label>Full Name</label><input value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))} /></div>
        <div><label>Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
        <div><label>Tier</label><select value={form.tier} onChange={e=>setForm(f=>({...f,tier:e.target.value}))}><option value="standard">Standard</option><option value="silver">Silver</option><option value="gold">Gold</option></select></div>
        <div><label>Status</label><select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
        <div style={{ gridColumn:"1/-1" }}><button type="submit" className="adp-btn adp-btn-g" disabled={saving}>{saving?"Saving…":"Save Agency Info"}</button></div>
      </form>
    </Card>

    {/* 2. Financial */}
    <Card title="Financial" sub="Balance aur credit limit — sirf admin change kar sakta hai">
      <form onSubmit={saveAgent} className="adp-fg adp-fr">
        <div><label>Balance (PKR)</label><input type="number" value={form.balance} onChange={e=>setForm(f=>({...f,balance:e.target.value}))} /><span style={{ fontSize:11, opacity:0.5, display:"block", marginTop:3 }}>Negative = agency owes office</span></div>
        <div><label>Credit Limit (PKR)</label><input type="number" value={form.creditLimit} onChange={e=>setForm(f=>({...f,creditLimit:e.target.value}))} /></div>
        <div style={{ gridColumn:"1/-1" }}><button type="submit" className="adp-btn adp-btn-g" disabled={saving}>{saving?"Saving…":"Save Financial"}</button></div>
      </form>
    </Card>

    {/* 3. Commission Rates */}
    <Card title="Commission Rates" sub="Har service per agent ko kitna commission milta hai">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:8, marginBottom:16 }}>
        {SERVICE_TYPES.map(st => {
          const r = agent.commissionRates.find(x => x.serviceType === st);
          return (
            <div key={st} style={{ background:"var(--a-surface-2,rgba(255,255,255,0.04))", borderRadius:8, padding:"10px 14px", border:"1px solid var(--a-border)" }}>
              <div style={{ fontSize:11, opacity:0.6, marginBottom:4 }}>{SVC_LABEL[st]}</div>
              {r ? <div style={{ fontWeight:600, fontSize:15 }}>{r.rateType==="percentage"?`${r.value}%`:`PKR ${r.value.toLocaleString()}`}<span style={{ fontSize:10, opacity:0.45, marginLeft:4 }}>{r.rateType}</span></div>
                 : <div style={{ opacity:0.35, fontSize:13 }}>Not set</div>}
            </div>
          );
        })}
      </div>
      <form onSubmit={saveRate} style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"flex-end" }}>
        <div><label style={{ fontSize:11, opacity:0.6, display:"block", marginBottom:4 }}>Service</label><select value={rateForm.serviceType} onChange={e=>setRateForm(f=>({...f,serviceType:e.target.value}))} style={{ width:"auto" }}>{SERVICE_TYPES.map(s=><option key={s} value={s}>{SVC_LABEL[s]}</option>)}</select></div>
        <div><label style={{ fontSize:11, opacity:0.6, display:"block", marginBottom:4 }}>Type</label><select value={rateForm.rateType} onChange={e=>setRateForm(f=>({...f,rateType:e.target.value}))} style={{ width:"auto" }}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (PKR)</option></select></div>
        <div><label style={{ fontSize:11, opacity:0.6, display:"block", marginBottom:4 }}>Value</label><input type="number" value={rateForm.value} onChange={e=>setRateForm(f=>({...f,value:e.target.value}))} style={{ width:100 }} /></div>
        <button type="submit" className="adp-btn adp-btn-g">Set Rate</button>
      </form>
    </Card>

    {/* 4. Staff / Sub-Users */}
    <Card title="Staff / Sub-Users" sub="Agency ke staff members — alag login, shared balance. Issue Tickets sirf main login se.">
      {subUsers.map(u => (
        <div key={u.id} style={{ background:"var(--a-surface-2,rgba(255,255,255,0.04))", border:"1px solid var(--a-border)", borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{u.fullName}</div>
              <div style={{ fontSize:12, opacity:0.6 }}>{u.email}{u.designation?` · ${u.designation}`:""}</div>
              <span className={`adp-pill adp-p-${u.status}`} style={{ marginTop:4, display:"inline-block" }}>{u.status}</span>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <button className="adp-btn adp-btn-s" onClick={() => { setEditId(editId===u.id?null:u.id); setEditPerms({...DEFAULT_PERMS,...u.permissions}); setEditStatus(u.status); }}>{editId===u.id?"Cancel":"Edit Permissions"}</button>
              <button className="adp-btn adp-btn-r" onClick={()=>toggleSub(u)}>{u.status==="active"?"Deactivate":"Activate"}</button>
              <button className="adp-btn adp-btn-r" onClick={()=>deleteSub(u)}>Delete</button>
            </div>
          </div>
          {editId === u.id ? (
            <div style={{ marginTop:14, borderTop:"1px solid var(--a-border)", paddingTop:14 }}>
              <PermToggle perms={editPerms} setPerms={setEditPerms as (p:Record<Perm,boolean>)=>void} />
              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                <button className="adp-btn adp-btn-g" onClick={()=>saveSub(u.id)}>Save</button>
                <button className="adp-btn adp-btn-s" onClick={()=>setEditId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6 }}>
              {(Object.keys(PERM_LABELS) as Perm[]).map(k => (
                <span key={k} style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:u.permissions[k]?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.05)", color:u.permissions[k]?"var(--a-green)":"var(--a-muted)", border:"1px solid", borderColor:u.permissions[k]?"rgba(34,197,94,0.3)":"var(--a-border)" }}>
                  {u.permissions[k]?"✓":"✗"} {PERM_LABELS[k].label}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {!showNew ? (
        <button className="adp-btn adp-btn-g" onClick={()=>setShowNew(true)}>+ Add Staff Member</button>
      ) : (
        <div style={{ background:"var(--a-surface-2,rgba(255,255,255,0.04))", border:"1px solid var(--a-border)", borderRadius:10, padding:16 }}>
          <div style={{ fontWeight:600, marginBottom:12 }}>New Staff Member</div>
          <form onSubmit={createSub}>
            <div className="adp-fg adp-fr" style={{ marginBottom:14 }}>
              <div><label>Full Name</label><input value={newU.fullName} onChange={e=>setNewU(f=>({...f,fullName:e.target.value}))} required /></div>
              <div><label>Email</label><input type="email" value={newU.email} onChange={e=>setNewU(f=>({...f,email:e.target.value}))} required /></div>
              <div><label>Phone</label><input value={newU.phone} onChange={e=>setNewU(f=>({...f,phone:e.target.value}))} /></div>
              <div><label>Designation <span style={{ fontSize:11, opacity:0.5 }}>(e.g. Sales Manager, Ticketing Staff)</span></label><input value={newU.designation} onChange={e=>setNewU(f=>({...f,designation:e.target.value}))} /></div>
              <div style={{ gridColumn:"1/-1" }}><label>Password (min 8 chars)</label><input type="password" value={newU.password} onChange={e=>setNewU(f=>({...f,password:e.target.value}))} required minLength={8} /></div>
            </div>
            <div style={{ fontWeight:500, fontSize:13, marginBottom:10 }}>Permissions <span style={{ fontWeight:400, opacity:0.5, fontSize:11 }}>— sab by default ON</span></div>
            <PermToggle perms={newPerms} setPerms={setNewPerms as (p:Record<Perm,boolean>)=>void} />
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button type="submit" className="adp-btn adp-btn-g" disabled={savingU}>{savingU?"Creating…":"Create Staff Member"}</button>
              <button type="button" className="adp-btn adp-btn-s" onClick={()=>setShowNew(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </Card>
  </>);
}

export default function EditAgentPage() {
  return <AdminGuard><AdminShell><EditAgentInner /></AdminShell></AdminGuard>;
}
