import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db.js";

// Auth is enforced by middleware.js before this route ever runs.
export async function GET() {
    try {
        const db = getDb();
        const { rows } = await db.query("SELECT * FROM requests ORDER BY created_at DESC LIMIT 200");
        return NextResponse.json(rows);
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch requests", detail: err.message }, { status: 500 });
    }
}
