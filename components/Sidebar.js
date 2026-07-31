"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TABS = [
    { key: "dashboard", label: "📦 Requests", href: "/dashboard", roles: ["admin"] },
    { key: "teams", label: "🚚 Teams", href: "/teams", roles: ["admin"] },
    { key: "cbm", label: "📐 CBM Calculator", href: "/cbm", roles: ["admin"] },
    {
        key: "marketing",
        label: "📣 Marketing",
        roles: ["admin", "marketing"],
        children: [
            { key: "marketing-qr-codes", label: "QR Code", href: "/marketing/qr-codes" }
        ]
    }
];

export default function Sidebar({ activeTab, onLogout, extra }) {
    const [role, setRole] = useState(null);

    useEffect(() => {
        fetch("/api/session").then(r => r.ok ? r.json() : null).then(data => setRole(data?.role || "admin")).catch(() => setRole("admin"));
    }, []);

    const tabs = role ? TABS.filter(t => t.roles.includes(role)) : [];

    return (
        <aside style={{
            width: 240,
            minWidth: 240,
            height: "100vh",
            position: "sticky",
            top: 0,
            overflowY: "auto",
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
                {tabs.map(t => t.children ? (
                    <div key={t.key}>
                        <div style={{
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: 600,
                            padding: "11px 14px"
                        }}>
                            {t.label}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 16 }}>
                            {t.children.map(c => (
                                <Link
                                    key={c.key}
                                    href={c.href}
                                    style={{
                                        color: "#fff",
                                        textDecoration: "none",
                                        fontSize: 13.5,
                                        fontWeight: 600,
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        background: activeTab === c.key ? "rgba(255,255,255,0.18)" : "transparent"
                                    }}
                                >
                                    {c.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
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
