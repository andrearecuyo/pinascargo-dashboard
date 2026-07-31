import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth.js";

// Paths a "marketing" role user is allowed into. Every other role (currently just "admin") gets everything.
const MARKETING_ALLOWED_PREFIXES = ["/marketing", "/api/marketing", "/api/session"];

export async function middleware(request) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);

    if (!session) {
        if (request.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    if (session.role === "marketing") {
        const allowed = MARKETING_ALLOWED_PREFIXES.some(p => request.nextUrl.pathname.startsWith(p));
        if (!allowed) {
            if (request.nextUrl.pathname.startsWith("/api/")) {
                return NextResponse.json({ error: "Not authorized for this module." }, { status: 403 });
            }
            return NextResponse.redirect(new URL("/marketing/qr-codes", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/teams/:path*",
        "/cbm/:path*",
        "/marketing/:path*",
        "/api/requests/:path*",
        "/api/teams/:path*",
        "/api/match-driver/:path*",
        "/api/match-driver-by-address/:path*",
        "/api/marketing/:path*",
        "/api/session/:path*"
    ]
};
