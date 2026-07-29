"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar.js";
import PageHeader from "../../components/PageHeader.js";

function emptyItem() {
    return { label: "", length: "", width: "", height: "", qty: "1" };
}

export default function CbmPage() {
    const router = useRouter();
    const [items, setItems] = useState([emptyItem()]);

    function updateItem(idx, field, value) {
        setItems(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
    }

    function addItem() {
        setItems([...items, emptyItem()]);
    }

    function removeItem(idx) {
        setItems(items.filter((_, i) => i !== idx));
    }

    const computed = useMemo(() => {
        return items.map(it => {
            const l = parseFloat(it.length) || 0;
            const w = parseFloat(it.width) || 0;
            const h = parseFloat(it.height) || 0;
            const qty = parseInt(it.qty, 10) || 0;
            const cbmPerUnit = (l * w * h) / 1_000_000; // cm -> cubic meters
            return { cbmPerUnit, totalCbm: cbmPerUnit * qty };
        });
    }, [items]);

    const grandTotal = computed.reduce((sum, c) => sum + c.totalCbm, 0);

    async function handleLogout() {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    }

    return (
        <div style={{ display: "flex" }}>
            <Sidebar activeTab="cbm" onLogout={handleLogout} />

            <main style={{ flex: 1, padding: 24, maxWidth: 1000, margin: "0 auto" }}>
                <PageHeader title="CBM" />
                <p style={{ color: "#4B5468", fontSize: 14, marginTop: 0 }}>
                    Enter box dimensions in centimeters. Cubic Meters (CBM) = (Length × Width × Height) ÷ 1,000,000.
                    This is a standalone calculator — not tied to any request or team assignment.
                </p>

                <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px rgba(20,24,80,0.08)", overflowX: "auto", marginBottom: 16 }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
                        <thead>
                            <tr>
                                {["Label (optional)", "Length (cm)", "Width (cm)", "Height (cm)", "Qty", "CBM / unit", "Total CBM", ""].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={idx}>
                                    <td style={tdStyle}>
                                        <input value={it.label} onChange={e => updateItem(idx, "label", e.target.value)} placeholder="e.g. Medium box" style={cellInputStyle} />
                                    </td>
                                    <td style={tdStyle}><input type="number" min="0" value={it.length} onChange={e => updateItem(idx, "length", e.target.value)} style={cellInputStyle} /></td>
                                    <td style={tdStyle}><input type="number" min="0" value={it.width} onChange={e => updateItem(idx, "width", e.target.value)} style={cellInputStyle} /></td>
                                    <td style={tdStyle}><input type="number" min="0" value={it.height} onChange={e => updateItem(idx, "height", e.target.value)} style={cellInputStyle} /></td>
                                    <td style={tdStyle}><input type="number" min="1" value={it.qty} onChange={e => updateItem(idx, "qty", e.target.value)} style={{ ...cellInputStyle, width: 60 }} /></td>
                                    <td style={tdStyle}>{computed[idx].cbmPerUnit.toFixed(4)} m³</td>
                                    <td style={tdStyle}><strong>{computed[idx].totalCbm.toFixed(4)} m³</strong></td>
                                    <td style={tdStyle}>
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(idx)} style={removeBtnStyle} title="Remove">×</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <button onClick={addItem} style={addBtnStyle}>+ Add another box</button>
                    <div style={{
                        background: "#FFF3E0", border: "1px solid #FFCC80", borderRadius: 10,
                        padding: "14px 18px", fontSize: 16, fontWeight: 700, color: "#5C3A00"
                    }}>
                        Grand Total: {grandTotal.toFixed(4)} m³
                    </div>
                </div>
            </main>
        </div>
    );
}

const thStyle = { padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #EEF0F4", background: "#F7F8FA", fontWeight: 700, whiteSpace: "nowrap" };
const tdStyle = { padding: "8px 10px", borderBottom: "1px solid #EEF0F4", whiteSpace: "nowrap" };
const cellInputStyle = { width: 100, boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E2E4E9", borderRadius: 6, fontSize: 13.5 };
const addBtnStyle = { background: "#1B1F5C", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const removeBtnStyle = { background: "#FDEDEC", color: "#E2231A", border: "none", borderRadius: 6, width: 26, height: 26, fontSize: 16, fontWeight: 700, cursor: "pointer" };
