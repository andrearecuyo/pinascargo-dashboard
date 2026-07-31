import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SESSION_COOKIE, REMEMBER_MAX_AGE_MS, REMEMBER_MAX_AGE_SECONDS, createSessionToken } from "../../../lib/auth.js";
import { getDb } from "../../../lib/db.js";

async function issueSession(session, rememberMe) {
    const token = await createSessionToken(session, rememberMe ? REMEMBER_MAX_AGE_MS : undefined);
    const response = NextResponse.json({ ok: true, role: session.role });
    response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        // Omitting maxAge makes this a session cookie that the browser drops on close;
        // the token itself still carries its own short expiry as a safety net.
        ...(rememberMe ? { maxAge: REMEMBER_MAX_AGE_SECONDS } : {}),
        path: "/"
    });
    return response;
}

export async function POST(request) {
    const { email, password, rememberMe } = await request.json();

    // Legacy path: the shared admin password still logs in as a full-access admin.
    if (!email && process.env.DASHBOARD_PASSWORD && password === process.env.DASHBOARD_PASSWORD) {
        return issueSession({ role: "admin" }, rememberMe);
    }

    if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    try {
        const db = getDb();
        const { rows } = await db.query("SELECT id, email, password_hash, role FROM users WHERE email = $1", [email.toLowerCase().trim()]);
        const user = rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
        }
        return issueSession({ role: user.role, email: user.email, userId: user.id }, rememberMe);
    } catch (err) {
        return NextResponse.json({ error: "Login failed.", detail: err.message }, { status: 500 });
    }
}
