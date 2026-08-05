import { getDb } from "../../../../lib/db.js";
import { buildVCardPayload } from "../../../../lib/vcard.js";

export async function GET(request, { params }) {
    const { slug } = await params;
    const db = getDb();
    const { rows } = await db.query("SELECT * FROM qr_codes WHERE slug = $1 AND type = 'vcard'", [slug]);
    const qr = rows[0];
    if (!qr) return new Response("Not found.", { status: 404 });

    const vcf = buildVCardPayload(qr);
    const filename = (qr.contact_name || qr.company_name || qr.name || "contact").replace(/[^a-z0-9]+/gi, "-");
    return new Response(vcf, {
        headers: {
            "Content-Type": "text/vcard; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}.vcf"`
        }
    });
}
