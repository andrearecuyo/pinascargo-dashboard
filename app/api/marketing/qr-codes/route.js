import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "../../../../lib/db.js";

// Auth is enforced by middleware.js before these routes ever run.

function genSlug() {
    return crypto.randomBytes(5).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 7).toLowerCase();
}

export async function GET() {
    try {
        const db = getDb();
        const { rows: codes } = await db.query("SELECT * FROM qr_codes ORDER BY created_at DESC");
        const { rows: links } = await db.query("SELECT id, qr_code_id, label, url, sort_order FROM qr_code_links ORDER BY sort_order, id");
        const byCode = {};
        for (const l of links) (byCode[l.qr_code_id] ??= []).push(l);
        return NextResponse.json(codes.map(c => ({ ...c, links: byCode[c.id] || [] })));
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch QR codes", detail: err.message }, { status: 500 });
    }
}

function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export async function POST(request) {
    const body = await request.json();
    const {
        name, type, target_url, company_name, tagline, logo_url, phone, email, address, website, links,
        contact_name, job_title, ios_url, android_url, fallback_url, fg_color, bg_color
    } = body;

    if (!name || !type) {
        return NextResponse.json({ error: "name and type are required." }, { status: 400 });
    }
    if (!["link", "multilink", "vcard", "applink"].includes(type)) {
        return NextResponse.json({ error: "type must be 'link', 'multilink', 'vcard', or 'applink'." }, { status: 400 });
    }
    if (type === "link" && !target_url) {
        return NextResponse.json({ error: "target_url is required for a single-link QR code." }, { status: 400 });
    }
    if (type === "vcard" && !contact_name && !company_name) {
        return NextResponse.json({ error: "contact_name or company_name is required for a vCard QR code." }, { status: 400 });
    }
    if (type === "applink" && !ios_url && !android_url && !fallback_url) {
        return NextResponse.json({ error: "At least one of ios_url, android_url, or fallback_url is required for an App Link QR code." }, { status: 400 });
    }
    if (fg_color !== undefined && fg_color !== "" && !isHexColor(fg_color)) {
        return NextResponse.json({ error: "fg_color must be a hex color like #1B1F5C." }, { status: 400 });
    }
    if (bg_color !== undefined && bg_color !== "" && !isHexColor(bg_color)) {
        return NextResponse.json({ error: "bg_color must be a hex color like #FFFFFF." }, { status: 400 });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        let slug, rows;
        for (let attempt = 0; attempt < 5; attempt++) {
            slug = genSlug();
            try {
                ({ rows } = await client.query(
                    `INSERT INTO qr_codes (slug, name, type, target_url, company_name, tagline, logo_url, phone, email, address, website,
                        contact_name, job_title, ios_url, android_url, fallback_url, fg_color, bg_color)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id, slug`,
                    [slug, name, type, type === "link" ? target_url : null, company_name || null, tagline || null, logo_url || null, phone || null, email || null, address || null, website || null,
                        contact_name || null, job_title || null, ios_url || null, android_url || null, fallback_url || null, fg_color || "#000000", bg_color || "#FFFFFF"]
                ));
                break;
            } catch (err) {
                if (err.code === "23505" && attempt < 4) continue; // slug collision, retry
                throw err;
            }
        }

        const qrCodeId = rows[0].id;
        if (type === "multilink") {
            let order = 0;
            for (const link of (links || [])) {
                if (!link.label?.trim() || !link.url?.trim()) continue;
                await client.query(
                    "INSERT INTO qr_code_links (qr_code_id, label, url, sort_order) VALUES ($1, $2, $3, $4)",
                    [qrCodeId, link.label.trim(), link.url.trim(), order++]
                );
            }
        }

        await client.query("COMMIT");
        return NextResponse.json({ ok: true, id: qrCodeId, slug: rows[0].slug });
    } catch (err) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Failed to create QR code", detail: err.message }, { status: 500 });
    } finally {
        client.release();
    }
}
