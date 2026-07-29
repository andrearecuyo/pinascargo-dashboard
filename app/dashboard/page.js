"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar.js";
import PageHeader from "../../components/PageHeader.js";

export default function DashboardPage() {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState("Loading...");
    const [typeFilter, setTypeFilter] = useState("");
    const [assignedFilter, setAssignedFilter] = useState("");
    const [search, setSearch] = useState("");

    async function loadRequests() {
        setStatus("Loading...");
        try {
            const response = await fetch("/api/requests");
            if (response.status === 401) {
                router.push("/login");
                return;
            }
            if (!response.ok) throw new Error("HTTP " + response.status);
            setRequests(await response.json());
            setStatus("");
        } catch (err) {
            setStatus("Failed to load requests: " + err.message);
        }
    }

    useEffect(() => {
        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleLogout() {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    }

    const filtered = useMemo(() => {
        const searchLower = search.trim().toLowerCase();
        return requests.filter(r => {
            if (typeFilter && r.request_type !== typeFilter) return false;
            if (assignedFilter === "assigned" && !r.assigned_driver_code) return false;
            if (assignedFilter === "unassigned" && r.assigned_driver_code) return false;
            if (searchLower) {
                const haystack = [r.customer_name, r.customer_lname, r.customer_phone, r.customer_city, r.customer_address, r.pin_address]
                    .filter(Boolean).join(" ").toLowerCase();
                if (!haystack.includes(searchLower)) return false;
            }
            return true;
        });
    }, [requests, typeFilter, assignedFilter, search]);

    return (
        <div style={{ display: "flex" }}>
            <Sidebar
                activeTab="dashboard"
                onLogout={handleLogout}
                extra={<span style={{ fontSize: 12, color: "#C7CBEE" }}>{requests.length} total — showing {filtered.length}</span>}
            />

            <main style={{ flex: 1, padding: 24, maxWidth: 1500, margin: "0 auto" }}>
                <PageHeader title="Box Delivery / Pick Up Request" />
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                    <button onClick={loadRequests} style={{
                        background: "#E2231A", color: "#fff", border: "none", borderRadius: 8,
                        padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer"
                    }}>
                        ↻ Refresh
                    </button>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
                        <option value="">All request types</option>
                        <option value="BOXSALE">Buy a box</option>
                        <option value="PICKUP">Pick up</option>
                    </select>
                    <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)} style={selectStyle}>
                        <option value="">All (assigned + unassigned)</option>
                        <option value="assigned">Assigned only</option>
                        <option value="unassigned">Unassigned only</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search name, phone, area..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...selectStyle, minWidth: 220 }}
                    />
                </div>

                <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px rgba(20,24,80,0.08)", overflowX: "auto" }}>
                    {status ? (
                        <div style={{ padding: 40, textAlign: "center", color: "#4B5468" }}>{status}</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: 40, textAlign: "center", color: "#4B5468" }}>No requests match these filters.</div>
                    ) : (
                        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
                            <thead>
                                <tr>
                                    {["Date", "Customer", "Phone", "City", "Address", "Pin Address", "Type", "Item Description", "Status", "Assigned Driver"].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <tr key={r.id}>
                                        <td style={tdStyle}>{new Date(r.created_at).toLocaleString()}</td>
                                        <td style={tdStyle}>{r.customer_name} {r.customer_lname}</td>
                                        <td style={tdStyle}>{r.customer_phone}</td>
                                        <td style={tdStyle}>{r.customer_city}</td>
                                        <td style={{ ...tdStyle, whiteSpace: "normal", maxWidth: 260 }}>{r.customer_address || ""}</td>
                                        <td style={{ ...tdStyle, whiteSpace: "normal", maxWidth: 260 }}>
                                            {r.pin_address ? (
                                                <a
                                                    href={`https://www.openstreetmap.org/?mlat=${r.customer_lat}&mlon=${r.customer_lng}#map=18/${r.customer_lat}/${r.customer_lng}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    style={{ color: "#1CA7EC" }}
                                                >
                                                    {r.pin_address}
                                                </a>
                                            ) : (
                                                <span style={{ color: "#9AA0AE" }}>No pin</span>
                                            )}
                                        </td>
                                        <td style={tdStyle}>{r.request_type}</td>
                                        <td style={{ ...tdStyle, whiteSpace: "normal", maxWidth: 260 }}>{r.item_description || ""}</td>
                                        <td style={tdStyle}>
                                            {r.pinas_status === 1 ? (
                                                <span style={badgeStyle("#E6F4EA", "#1E7E34")}>
                                                    Success{r.pinas_request_id ? ` #${r.pinas_request_id}` : ""}
                                                </span>
                                            ) : (
                                                <span style={badgeStyle("#FDEDEC", "#8B1A13")}>{r.pinas_message || "Failed"}</span>
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            {r.assigned_driver_code ? (
                                                <span style={badgeStyle("#E8F6FF", "#1275A8")}>
                                                    {r.assigned_driver_code} — {r.assigned_driver_names}
                                                </span>
                                            ) : (
                                                <span style={badgeStyle("#FFF3E0", "#B5690B")}>Unassigned</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}

const selectStyle = { padding: "9px 12px", border: "1px solid #E2E4E9", borderRadius: 8, fontSize: 14 };
const thStyle = { padding: "10px 12px", textAlign: "left", borderBottom: "1px solid #EEF0F4", background: "#F7F8FA", fontWeight: 700, whiteSpace: "nowrap" };
const tdStyle = { padding: "10px 12px", borderBottom: "1px solid #EEF0F4", whiteSpace: "nowrap" };
const badgeStyle = (bg, color) => ({ display: "inline-block", padding: "3px 9px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: bg, color });
