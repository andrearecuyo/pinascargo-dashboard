import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth.js";

export async function middleware(request) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const valid = await verifySessionToken(token);

    if (!valid) {
        if (request.nextUrl.pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/requests/:path*"]
};
