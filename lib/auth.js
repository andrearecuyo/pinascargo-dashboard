// Session token signing, using Web Crypto so this works in both Edge middleware and Node routes.

export const REMEMBER_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, when "Remember me" is checked
const DEFAULT_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours, safety-net expiry for a session-only cookie
export const SESSION_COOKIE = "pinascargo_session";

function bufToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// btoa/atob (not Buffer) so this keeps working under the Edge runtime middleware uses.
function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
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

// session: { role: "admin" | "marketing", email?: string, userId?: number }
export async function createSessionToken(session = { role: "admin" }, maxAgeMs = DEFAULT_MAX_AGE_MS) {
    const expires = Date.now() + maxAgeMs;
    const payload = b64urlEncode(JSON.stringify({ exp: expires, ...session }));
    const key = await getKey();
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return `${payload}.${bufToHex(sigBuf)}`;
}

// Returns the decoded session object if valid, otherwise null.
export async function verifySessionToken(token) {
    if (!token) return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;

    const key = await getKey();
    const expectedSigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    if (bufToHex(expectedSigBuf) !== sig) return null;

    let session;
    try {
        session = JSON.parse(b64urlDecode(payload));
    } catch {
        return null;
    }

    if (!session.exp || Date.now() > session.exp) return null;
    return { role: session.role || "admin", email: session.email || null, userId: session.userId || null };
}

export const REMEMBER_MAX_AGE_SECONDS = REMEMBER_MAX_AGE_MS / 1000;
