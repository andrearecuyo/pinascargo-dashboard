"use client";

import Link from "next/link";

const TABS = [
    { key: "dashboard", label: "📦 Requests", href: "/dashboard" },
    { key: "teams", label: "🚚 Teams", href: "/teams" },
    { key: "cbm", label: "📐 CBM Calculator", href: "/cbm" }
];

export default function Sidebar({ activeTab, onLogout, extra }) {
    return (
        <aside style={{
            width: 240,
            minWidth: 240,
            minHeight: "100vh",
            background: "#1B1F5C",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            padding: "24px 16px"
        }}>
            <img
                src="https://app.pinascargo.com/uploads/company/logo.png"
                alt="Pinas Express Cargo & Clearing LLC"
                style={{ width: "100%", maxWidth: 190, margin: "0 auto 28px", display: "block" }}
            />

            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {TABS.map(t => (
                    <Link
                        key={t.key}
                        href={t.href}
                        style={{
                            color: "#fff",
                            textDecoration: "none",
                            fontSize: 14,
                            fontWeight: 600,
                            padding: "11px 14px",
                            borderRadius: 8,
                            background: activeTab === t.key ? "rgba(255,255,255,0.18)" : "transparent"
                        }}
                    >
                        {t.label}
                    </Link>
                ))}
            </nav>

            {extra && <div style={{ marginTop: 20 }}>{extra}</div>}

            <div style={{ marginTop: "auto", paddingTop: 20 }}>
                <button onClick={onLogout} style={{
                    width: "100%",
                    background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 8, padding: "10px 14px", fontSize: 13, cursor: "pointer"
                }}>
                    Log out
                </button>
                <div style={{ fontSize: 11, color: "#8489C2", marginTop: 14, textAlign: "center" }}>
                    Pinas Cargo Standalone App<br />v1.0.0
                </div>
            </div>
        </aside>
    );
}
