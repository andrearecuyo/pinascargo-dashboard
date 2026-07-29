import { NextResponse } from "next/server";
import { matchDriverByAddress } from "../../../lib/matchDriver.js";

// Auth is enforced by middleware.js before this route ever runs.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    try {
        const matches = await matchDriverByAddress(address);
        return NextResponse.json({ matches });
    } catch (err) {
        return NextResponse.json({ error: "Lookup failed", detail: err.message }, { status: 500 });
    }
}
