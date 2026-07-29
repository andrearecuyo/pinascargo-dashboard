"use client";

import Link from "next/link";

const TABS = [
    { key: "dashboard", label: "Requests", href: "/dashboard" },
    { key: "teams", label: "Teams", href: "/teams" },
    { key: "cbm", label: "CBM Calculator", href: "/cbm" }
];

export default function NavHeader({ title, activeTab, onLogout, extra }) {
    return (
        <header style={{
            background: "#1B1F5C", color: "#fff", padding: "16px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>
                <nav style={{ display: "flex", gap: 4 }}>
                    {TABS.map(t => (
                        <Link
                            key={t.key}
                            href={t.href}
                            style={{
                                color: "#fff",
                                textDecoration: "none",
                                fontSize: 13,
                                fontWeight: 600,
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: activeTab === t.key ? "rgba(255,255,255,0.18)" : "transparent"
                            }}
                        >
                            {t.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {extra}
                <button onClick={onLogout} style={{
                    background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer"
                }}>
                    Log out
                </button>
            </div>
        </header>
    );
}
