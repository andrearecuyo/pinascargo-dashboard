function escapeVCardValue(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildVCardPayload(qr) {
    const lines = ["BEGIN:VCARD", "VERSION:3.0"];
    if (qr.contact_name) lines.push(`FN:${escapeVCardValue(qr.contact_name)}`, `N:${escapeVCardValue(qr.contact_name)};;;;`);
    if (qr.company_name) lines.push(`ORG:${escapeVCardValue(qr.company_name)}`);
    if (qr.job_title) lines.push(`TITLE:${escapeVCardValue(qr.job_title)}`);
    if (qr.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(qr.phone)}`);
    if (qr.email) lines.push(`EMAIL:${escapeVCardValue(qr.email)}`);
    if (qr.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(qr.address)};;;;`);
    if (qr.website) lines.push(`URL:${escapeVCardValue(qr.website)}`);
    lines.push("END:VCARD");
    return lines.join("\n");
}
