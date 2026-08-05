import QRCode from "qrcode";
import sharp from "sharp";
import { getDb } from "../../../../../../lib/db.js";

const MIN_SIZE = 128;
const MAX_SIZE = 2000;
const DEFAULT_SIZE = 512;

// The QR image always encodes the qr code's stable /q/[slug] URL — since the slug never
// changes, a printed code stays valid no matter how the destination details (including
// vCard fields) are edited later. The /q/[slug] page renders the current data live.

function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

async function fetchLogoBuffer(logoUrl) {
    try {
        const response = await fetch(logoUrl);
        if (!response.ok) return null;
        return Buffer.from(await response.arrayBuffer());
    } catch {
        return null;
    }
}

async function compositeLogo(qrPng, size, logoUrl) {
    const logoRaw = await fetchLogoBuffer(logoUrl);
    if (!logoRaw) return qrPng;

    // A white rounded pad behind the logo keeps it readable against any QR module color,
    // and errorCorrectionLevel 'H' (set by the caller) gives the code enough redundancy
    // to stay scannable with a hole punched in the middle.
    const logoSize = Math.round(size * 0.22);
    const padSize = Math.round(logoSize * 1.25);
    let logo;
    try {
        logo = await sharp(logoRaw).resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).toBuffer();
    } catch {
        return qrPng;
    }

    const pad = await sharp({
        create: { width: padSize, height: padSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    }).composite([{
        input: Buffer.from(`<svg width="${padSize}" height="${padSize}"><rect width="${padSize}" height="${padSize}" rx="${Math.round(padSize * 0.18)}" fill="#fff"/></svg>`),
        blend: "dest-in"
    }]).png().toBuffer();

    const center = Math.round((size - padSize) / 2);
    const logoCenter = Math.round((padSize - logoSize) / 2);

    return sharp(qrPng)
        .composite([
            { input: pad, left: center, top: center },
            { input: logo, left: center + logoCenter, top: center + logoCenter }
        ])
        .png()
        .toBuffer();
}

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const db = getDb();
        const { rows } = await db.query("SELECT * FROM qr_codes WHERE id = $1", [id]);
        const qr = rows[0];
        if (!qr) return new Response("QR code not found.", { status: 404 });

        const searchParams = request.nextUrl.searchParams;
        let size = parseInt(searchParams.get("size"), 10);
        if (!Number.isFinite(size)) size = DEFAULT_SIZE;
        size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, size));

        const darkColor = isHexColor(qr.fg_color) ? qr.fg_color : "#000000";
        const lightColor = isHexColor(qr.bg_color) ? qr.bg_color : "#FFFFFF";
        const hasLogo = !!qr.logo_url;

        const payload = `${request.nextUrl.origin}/q/${qr.slug}`;

        let png = await QRCode.toBuffer(payload, {
            type: "png",
            width: size,
            margin: 2,
            errorCorrectionLevel: hasLogo ? "H" : "M",
            color: { dark: darkColor, light: lightColor }
        });

        if (hasLogo) png = await compositeLogo(png, size, qr.logo_url);

        return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
    } catch (err) {
        return new Response("Failed to generate QR image: " + err.message, { status: 500 });
    }
}
