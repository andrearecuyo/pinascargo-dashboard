import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken } from "../../../lib/auth.js";

export async function POST(request) {
    const { password } = await request.json();

    if (!process.env.DASHBOARD_PASSWORD) {
        return NextResponse.json({ error: "DASHBOARD_PASSWORD is not configured on the server." }, { status: 500 });
    }

    if (password !== process.env.DASHBOARD_PASSWORD) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/"
    });
    return response;
}
