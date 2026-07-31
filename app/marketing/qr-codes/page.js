"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar.js";
import PageHeader from "../../../components/PageHeader.js";

function emptyForm() {
    return {
        name: "", type: "link", target_url: "",
        company_name: "", tagline: "", logo_url: "", phone: "", email: "", address: "", website: "",
        links: [{ label: "", url: "" }]
    };
}

export default function QrCodesPage() {
    const router = useRouter();
    const [codes, setCodes] = useState([]);
    const [status, setStatus] = useState("Loading...");
    const [editingId, setEditingId] = useState(null); // null = none, "new" = add form, or a qr code id
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setStatus("Loading...");
        try {
            const response = await fetch("/api/marketing/qr-codes");
            if (response.status === 401) { router.push("/login"); return; }
            if (!response.ok) throw new Error("HTTP " + response.status);
            setCodes(await response.json());
            setStatus("");
        } catch (err) {
            setStatus("Failed to load QR codes: " + err.message);
        }
    }

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function startAdd() {
        setForm(emptyForm());
        setEditingId("new");
        setError("");
    }

    function startEdit(c) {
        setForm({
            name: c.name,
            type: c.type,
            target_url: c.target_url || "",
            company_name: c.company_name || "",
            tagline: c.tagline || "",
            logo_url: c.logo_url || "",
            phone: c.phone || "",
            email: c.email || "",
            address: c.address || "",
            website: c.website || "",
            links: c.links.length ? c.links.map(l => ({ label: l.label, url: l.url })) : [{ label: "", url: "" }]
        });
        setEditingId(c.id);
        setError("");
    }

    function cancelEdit() {
        setEditingId(null);
        setError("");
    }

    function updateLink(i, field, value) {
        const links = [...form.links];
        links[i] = { ...links[i], [field]: value };
        setForm({ ...form, links });
    }

    function addLinkRow() {
        setForm({ ...form, links: [...form.links, { label: "", url: "" }] });
    }

    function removeLinkRow(i) {
        setForm({ ...form, links: form.links.filter((_, idx) => idx !== i) });
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
            name: form.name.trim(),
            type: form.type,
            target_url: form.type === "link" ? form.target_url.trim() : null,
            company_name: form.company_name.trim(),
            tagline: form.tagline.trim(),
            logo_url: form.logo_url.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
            website: form.website.trim(),
            links: form.type === "multilink" ? form.links.filter(l => l.label.trim() && l.url.trim()) : []
        };

        const isNew = editingId === "new";
        const url = isNew ? "/api/marketing/qr-codes" : `/api/marketing/qr-codes/${editingId}`;
        const method = isNew ? "POST" : "PUT";

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error + (data.detail ? ` (${data.detail})` : ""));
                return;
            }
            setEditingId(null);
            await load();
        } catch (err) {
            setError("Something went wrong: " + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(c) {
        if (!confirm(`Delete "${c.name}"? Its QR code will stop working.`)) return;
        try {
            const response = await fetch(`/api/marketing/qr-codes/${c.id}`, { method: "DELETE" });
            if (!response.ok) {
                const data = await response.json();
                alert(data.error || "Failed to delete.");
                return;
            }
            await load();
        } catch (err) {
            alert("Failed to delete: " + err.message);
        }
    }

    return (
        <div style={{ display: "flex" }}>
            <Sidebar activeTab="marketing-qr-codes" onLogout={async () => { await fetch("/api/logout", { method: "POST" }); router.push("/login"); }} />

            <main style={{ flex: 1, padding: 24, maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <PageHeader title="QR Codes" />
                    <button onClick={startAdd} style={addBtnStyle}>+ New QR Code</button>
                </div>

                {status && <div style={{ padding: 20, textAlign: "center", color: "#4B5468" }}>{status}</div>}

                {!status && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                        {codes.map(c => (
                            <div key={c.id} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px rgba(20,24,80,0.08)", padding: 18 }}>
                                <div style={{ display: "flex", gap: 14 }}>
                                    <img src={`/api/marketing/qr-codes/${c.id}/image`} alt={c.name} style={{ width: 90, height: 90, borderRadius: 8, border: "1px solid #EEF0F4" }} />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: "#1B1F5C", fontSize: 15 }}>{c.name}</div>
                                        <div style={{ fontSize: 12, color: "#9AA0AE", marginBottom: 6, textTransform: "capitalize" }}>{c.type === "link" ? "Single link" : "Multi-link"}</div>
                                        <div style={{ fontSize: 12.5, color: "#4B5468", wordBreak: "break-all" }}>
                                            {c.type === "link" ? c.target_url : `${c.links.length} link${c.links.length === 1 ? "" : "s"}`}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                                    <button onClick={() => startEdit(c)} style={linkBtnStyle}>Edit</button>
                                    <a href={`/api/marketing/qr-codes/${c.id}/image`} download={`${c.name}-qr.png`} style={{ ...linkBtnStyle, textDecoration: "none" }}>Download</a>
                                    <button onClick={() => handleDelete(c)} style={{ ...linkBtnStyle, color: "#E2231A" }}>Delete</button>
                                </div>
                            </div>
                        ))}
                        {codes.length === 0 && <div style={{ color: "#9AA0AE", padding: 20 }}>No QR codes yet.</div>}
                    </div>
                )}

                {editingId !== null && (
                    <div style={overlayStyle} onClick={cancelEdit}>
                        <form onClick={e => e.stopPropagation()} onSubmit={handleSave} style={modalStyle}>
                            <h3 style={{ marginTop: 0 }}>{editingId === "new" ? "New QR Code" : `Edit ${form.name}`}</h3>

                            <div style={fieldGridStyle}>
                                <div>
                                    <label style={labelStyle}>Name *</label>
                                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="e.g. Facebook Page" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Type *</label>
                                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle} disabled={editingId !== "new"}>
                                        <option value="link">Single link (redirects straight to a URL)</option>
                                        <option value="multilink">Multi-link (company details + all links)</option>
                                    </select>
                                </div>
                            </div>

                            {form.type === "link" && (
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Destination URL *</label>
                                    <input required type="url" value={form.target_url} onChange={e => setForm({ ...form, target_url: e.target.value })} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} placeholder="https://facebook.com/yourpage" />
                                </div>
                            )}

                            {form.type === "multilink" && (
                                <>
                                    <div style={fieldGridStyle}>
                                        <div>
                                            <label style={labelStyle}>Company Name</label>
                                            <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Tagline</label>
                                            <input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Logo URL</label>
                                            <input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Phone</label>
                                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Email</label>
                                            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Website</label>
                                            <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} style={inputStyle} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 14 }}>
                                        <label style={labelStyle}>Address</label>
                                        <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
                                    </div>

                                    <label style={labelStyle}>Social / Other Links</label>
                                    {form.links.map((l, i) => (
                                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                            <input value={l.label} onChange={e => updateLink(i, "label", e.target.value)} style={{ ...inputStyle, flex: "0 0 140px" }} placeholder="Facebook" />
                                            <input value={l.url} onChange={e => updateLink(i, "url", e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="https://facebook.com/yourpage" />
                                            <button type="button" onClick={() => removeLinkRow(i)} style={{ ...linkBtnStyle, color: "#E2231A" }}>✕</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addLinkRow} style={{ ...linkBtnStyle, marginBottom: 10 }}>+ Add link</button>
                                </>
                            )}

                            {error && <div style={{ color: "#E2231A", fontSize: 14, marginTop: 8 }}>{error}</div>}

                            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                                <button type="button" onClick={cancelEdit} style={cancelBtnStyle}>Cancel</button>
                                <button type="submit" disabled={saving} style={saveBtnStyle}>{saving ? "Saving..." : "Save"}</button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

const addBtnStyle = { background: "#1B1F5C", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const linkBtnStyle = { background: "none", border: "none", color: "#1CA7EC", cursor: "pointer", fontSize: 13, padding: 0 };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(20,24,80,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 };
const modalStyle = { background: "#fff", borderRadius: 16, padding: 30, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(20,24,80,0.25)" };
const fieldGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#1B1F5C" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1px solid #E2E4E9", borderRadius: 8, fontSize: 14 };
const cancelBtnStyle = { background: "#F7F8FA", border: "1px solid #E2E4E9", borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer" };
const saveBtnStyle = { background: "#E2231A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
