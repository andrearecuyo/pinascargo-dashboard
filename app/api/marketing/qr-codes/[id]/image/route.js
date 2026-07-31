import QRCode from "qrcode";
import { getDb } from "../../../../../../lib/db.js";

// The QR image encodes the qr code's stable /q/[slug] URL — since the slug never changes,
// this image stays valid no matter how the destination details are edited later.

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const db = getDb();
        const { rows } = await db.query("SELECT slug FROM qr_codes WHERE id = $1", [id]);
        if (!rows[0]) return new Response("QR code not found.", { status: 404 });

        const targetUrl = `${request.nextUrl.origin}/q/${rows[0].slug}`;
        const png = await QRCode.toBuffer(targetUrl, { type: "png", width: 512, margin: 2 });
        return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
    } catch (err) {
        return new Response("Failed to generate QR image: " + err.message, { status: 500 });
    }
}
