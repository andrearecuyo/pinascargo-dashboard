// Session token signing, using Web Crypto so this works in both Edge middleware and Node routes.

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_COOKIE = "pinascargo_session";

function bufToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET is not configured.");
    return crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

export async function createSessionToken() {
    const expires = Date.now() + SESSION_MAX_AGE_MS;
    const payload = String(expires);
    const key = await getKey();
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return `${payload}.${bufToHex(sigBuf)}`;
}

export async function verifySessionToken(token) {
    if (!token) return false;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;

    const key = await getKey();
    const expectedSigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    if (bufToHex(expectedSigBuf) !== sig) return false;

    const expires = Number(payload);
    if (Number.isNaN(expires) || Date.now() > expires) return false;
    return true;
}

export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;
