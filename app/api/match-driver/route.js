import { NextResponse } from "next/server";
import { matchDriver } from "../../../lib/matchDriver.js";

// Auth is enforced by middleware.js before this route ever runs.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const area = searchParams.get("area");

    try {
        const driver = await matchDriver(city, area);
        return NextResponse.json({ driver });
    } catch (err) {
        return NextResponse.json({ error: "Lookup failed", detail: err.message }, { status: 500 });
    }
}
