import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "../../../lib/auth.js";

export async function GET(request) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    return NextResponse.json({ role: session.role, email: session.email });
}
