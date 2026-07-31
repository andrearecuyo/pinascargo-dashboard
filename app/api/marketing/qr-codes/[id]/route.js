import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db.js";

// Auth is enforced by middleware.js before these routes ever run.
// Note: slug (and therefore the QR image itself) is never touched here — only the destination details change.

export async function PUT(request, { params }) {
    const { id } = await params;
    const { name, type, target_url, company_name, tagline, logo_url, phone, email, address, website, links } = await request.json();

    if (!name || !type) {
        return NextResponse.json({ error: "name and type are required." }, { status: 400 });
    }
    if (!["link", "multilink"].includes(type)) {
        return NextResponse.json({ error: "type must be 'link' or 'multilink'." }, { status: 400 });
    }
    if (type === "link" && !target_url) {
        return NextResponse.json({ error: "target_url is required for a single-link QR code." }, { status: 400 });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const { rowCount } = await client.query(
            `UPDATE qr_codes SET name=$1, type=$2, target_url=$3, company_name=$4, tagline=$5, logo_url=$6,
                phone=$7, email=$8, address=$9, website=$10, updated_at=now()
             WHERE id=$11`,
            [name, type, type === "link" ? target_url : null, company_name || null, tagline || null, logo_url || null, phone || null, email || null, address || null, website || null, id]
        );
        if (rowCount === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: "QR code not found." }, { status: 404 });
        }

        await client.query("DELETE FROM qr_code_links WHERE qr_code_id = $1", [id]);
        if (type === "multilink") {
            let order = 0;
            for (const link of (links || [])) {
                if (!link.label?.trim() || !link.url?.trim()) continue;
                await client.query(
                    "INSERT INTO qr_code_links (qr_code_id, label, url, sort_order) VALUES ($1, $2, $3, $4)",
                    [id, link.label.trim(), link.url.trim(), order++]
                );
            }
        }

        await client.query("COMMIT");
        return NextResponse.json({ ok: true });
    } catch (err) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Failed to update QR code", detail: err.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        const db = getDb();
        const { rowCount } = await db.query("DELETE FROM qr_codes WHERE id = $1", [id]);
        if (rowCount === 0) return NextResponse.json({ error: "QR code not found." }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to delete QR code", detail: err.message }, { status: 500 });
    }
}
