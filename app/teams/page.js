"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar.js";

const TEAM_ORDER = ["DUBAI", "ABU DHABI", "SHARJAH", "FUJAIRAH", "RAS AL KHAIMAH", "AL AIN"];
const DAY_OPTIONS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function emptyForm(team) {
    return { driver_code: "", dropdown_user_id: "", names: "", phone: "", day_off: "SUNDAY", team: team || TEAM_ORDER[0], areasText: "" };
}

export default function TeamsPage() {
    const router = useRouter();
    const [drivers, setDrivers] = useState([]);
    const [status, setStatus] = useState("Loading...");
    const [editingId, setEditingId] = useState(null); // null = none, "new" = add form, or a driver id
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function load() {
        setStatus("Loading...");
        try {
            const response = await fetch("/api/teams");
            if (response.status === 401) { router.push("/login"); return; }
            if (!response.ok) throw new Error("HTTP " + response.status);
            setDrivers(await response.json());
            setStatus("");
        } catch (err) {
            setStatus("Failed to load teams: " + err.message);
        }
    }

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const grouped = useMemo(() => {
        const g = {};
        for (const d of drivers) (g[d.team] ??= []).push(d);
        for (const team in g) g[team].sort((a, b) => a.driver_code.localeCompare(b.driver_code, undefined, { numeric: true }));
        return g;
    }, [drivers]);

    const teamNames = useMemo(() => {
        const names = new Set([...TEAM_ORDER, ...Object.keys(grouped)]);
        return TEAM_ORDER.filter(t => names.has(t)).concat([...names].filter(t => !TEAM_ORDER.includes(t)));
    }, [grouped]);

    function startAdd(team) {
        setForm(emptyForm(team));
        setEditingId("new");
        setError("");
    }

    function startEdit(d) {
        setForm({
            driver_code: d.driver_code,
            dropdown_user_id: d.dropdown_user_id ?? "",
            names: d.names,
            phone: d.phone,
            day_off: d.day_off,
            team: d.team,
            areasText: d.areas.map(a => a.area_name).join(", ")
        });
        setEditingId(d.id);
        setError("");
    }

    function cancelEdit() {
        setEditingId(null);
        setError("");
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
            driver_code: form.driver_code.trim(),
            dropdown_user_id: form.dropdown_user_id ? parseInt(form.dropdown_user_id, 10) : null,
            names: form.names.trim(),
            phone: form.phone.trim(),
            day_off: form.day_off,
            team: form.team,
            areas: form.areasText.split(",").map(a => a.trim()).filter(Boolean)
        };

        const isNew = editingId === "new";
        const url = isNew ? "/api/teams" : `/api/teams/${editingId}`;
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

    async function handleDelete(d) {
        if (!confirm(`Delete ${d.driver_code} (${d.names})? This also removes their area assignments.`)) return;
        try {
            const response = await fetch(`/api/teams/${d.id}`, { method: "DELETE" });
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
            <Sidebar activeTab="teams" onLogout={async () => { await fetch("/api/logout", { method: "POST" }); router.push("/login"); }} />

            <main style={{ flex: 1, padding: 24, maxWidth: 1300, margin: "0 auto" }}>
                {status && <div style={{ padding: 20, textAlign: "center", color: "#4B5468" }}>{status}</div>}

                {!status && teamNames.map(team => (
                    <div key={team} style={{ marginBottom: 28 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <h2 style={{ fontSize: 16, margin: 0, background: "#1B1F5C", color: "#fff", display: "inline-block", padding: "6px 14px", borderRadius: 8 }}>
                                TEAM {team}
                            </h2>
                            <button onClick={() => startAdd(team)} style={addBtnStyle}>+ Add driver</button>
                        </div>

                        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px rgba(20,24,80,0.08)", overflowX: "auto" }}>
                            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
                                <thead>
                                    <tr>
                                        {["Code", "Names", "Phone", "Day Off", "Driver ID", "Areas", ""].map(h => (
                                            <th key={h} style={thStyle}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(grouped[team] || []).map(d => (
                                        <tr key={d.id}>
                                            <td style={tdStyle}>{d.driver_code}</td>
                                            <td style={tdStyle}>{d.names}</td>
                                            <td style={tdStyle}>{d.phone}</td>
                                            <td style={tdStyle}>{d.day_off}</td>
                                            <td style={tdStyle}>{d.dropdown_user_id ?? "—"}</td>
                                            <td style={{ ...tdStyle, whiteSpace: "normal", maxWidth: 360, color: "#4B5468" }}>
                                                {d.areas.map(a => a.area_name).join(", ") || "—"}
                                            </td>
                                            <td style={tdStyle}>
                                                <button onClick={() => startEdit(d)} style={linkBtnStyle}>Edit</button>
                                                {" · "}
                                                <button onClick={() => handleDelete(d)} style={{ ...linkBtnStyle, color: "#E2231A" }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(grouped[team] || []).length === 0 && (
                                        <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#9AA0AE" }}>No drivers yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {editingId !== null && (
                    <div style={overlayStyle} onClick={cancelEdit}>
                        <form onClick={e => e.stopPropagation()} onSubmit={handleSave} style={modalStyle}>
                            <h3 style={{ marginTop: 0 }}>{editingId === "new" ? "Add Driver" : `Edit ${form.driver_code}`}</h3>

                            <div style={fieldGridStyle}>
                                <div>
                                    <label style={labelStyle}>Driver Code *</label>
                                    <input required value={form.driver_code} onChange={e => setForm({ ...form, driver_code: e.target.value })} style={inputStyle} placeholder="e.g. DXB 15" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Assign-to-Driver User ID</label>
                                    <input value={form.dropdown_user_id} onChange={e => setForm({ ...form, dropdown_user_id: e.target.value })} style={inputStyle} placeholder="e.g. 59" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Names *</label>
                                    <input required value={form.names} onChange={e => setForm({ ...form, names: e.target.value })} style={inputStyle} placeholder="e.g. JUAN/PEDRO" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone *</label>
                                    <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="e.g. 0501234567" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Day Off *</label>
                                    <select required value={form.day_off} onChange={e => setForm({ ...form, day_off: e.target.value })} style={inputStyle}>
                                        {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Team *</label>
                                    <select required value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} style={inputStyle}>
                                        {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <label style={labelStyle}>Areas (comma-separated)</label>
                            <textarea
                                rows={4}
                                value={form.areasText}
                                onChange={e => setForm({ ...form, areasText: e.target.value })}
                                style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }}
                                placeholder="AL BARSHA, JVC, JLT"
                            />

                            {error && <div style={{ color: "#E2231A", fontSize: 14, marginTop: 12 }}>{error}</div>}

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

const thStyle = { padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #EEF0F4", background: "#F7F8FA", fontWeight: 700, whiteSpace: "nowrap" };
const tdStyle = { padding: "10px 12px", borderBottom: "1px solid #EEF0F4", whiteSpace: "nowrap" };
const addBtnStyle = { background: "#1B1F5C", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const linkBtnStyle = { background: "none", border: "none", color: "#1CA7EC", cursor: "pointer", fontSize: 13, padding: 0 };
const overlayStyle = { position: "fixed", inset: 0, background: "rgba(20,24,80,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 };
const modalStyle = { background: "#fff", borderRadius: 16, padding: 30, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(20,24,80,0.25)" };
const fieldGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#1B1F5C" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1px solid #E2E4E9", borderRadius: 8, fontSize: 14 };
const cancelBtnStyle = { background: "#F7F8FA", border: "1px solid #E2E4E9", borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer" };
const saveBtnStyle = { background: "#E2231A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
