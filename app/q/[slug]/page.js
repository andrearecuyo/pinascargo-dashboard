import { redirect, notFound } from "next/navigation";
import { getDb } from "../../../lib/db.js";

export default async function QrLandingPage({ params }) {
    const { slug } = await params;
    const db = getDb();
    const { rows } = await db.query("SELECT * FROM qr_codes WHERE slug = $1", [slug]);
    const qr = rows[0];
    if (!qr) notFound();

    if (qr.type === "link") {
        redirect(qr.target_url);
    }

    const { rows: links } = await db.query(
        "SELECT label, url FROM qr_code_links WHERE qr_code_id = $1 ORDER BY sort_order, id",
        [qr.id]
    );

    return (
        <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", justifyContent: "center", padding: "40px 16px" }}>
            <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
                {qr.logo_url && (
                    <img src={qr.logo_url} alt={qr.company_name || qr.name} style={{ width: 96, height: 96, objectFit: "contain", margin: "0 auto 16px", display: "block" }} />
                )}
                <h1 style={{ fontSize: 22, color: "#1B1F5C", margin: "0 0 4px" }}>{qr.company_name || qr.name}</h1>
                {qr.tagline && <p style={{ color: "#4B5468", fontSize: 14, margin: "0 0 20px" }}>{qr.tagline}</p>}

                <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 4px 16px rgba(20,24,80,0.08)", marginBottom: 20, textAlign: "left" }}>
                    {qr.address && <div style={{ fontSize: 13.5, color: "#1B1F5C", marginBottom: 8 }}>📍 {qr.address}</div>}
                    {qr.phone && <div style={{ fontSize: 13.5, color: "#1B1F5C", marginBottom: 8 }}>📞 <a href={`tel:${qr.phone}`} style={{ color: "#1B1F5C" }}>{qr.phone}</a></div>}
                    {qr.email && <div style={{ fontSize: 13.5, color: "#1B1F5C", marginBottom: 8 }}>✉️ <a href={`mailto:${qr.email}`} style={{ color: "#1B1F5C" }}>{qr.email}</a></div>}
                    {qr.website && <div style={{ fontSize: 13.5, color: "#1B1F5C" }}>🌐 <a href={qr.website} style={{ color: "#1B1F5C" }}>{qr.website}</a></div>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {links.map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                            display: "block", background: "#1B1F5C", color: "#fff", textDecoration: "none",
                            borderRadius: 10, padding: "14px 16px", fontSize: 15, fontWeight: 700
                        }}>
                            {l.label}
                        </a>
                    ))}
                    {links.length === 0 && <p style={{ color: "#9AA0AE", fontSize: 13 }}>No links added yet.</p>}
                </div>
            </div>
        </div>
    );
}
