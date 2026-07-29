import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db.js";

// Auth is enforced by middleware.js before these routes ever run.

export async function GET() {
    try {
        const db = getDb();
        const { rows: drivers } = await db.query("SELECT * FROM drivers ORDER BY team, driver_code");
        const { rows: areas } = await db.query("SELECT id, driver_id, area_name FROM driver_areas ORDER BY area_name");
        const byDriver = {};
        for (const a of areas) (byDriver[a.driver_id] ??= []).push(a);
        return NextResponse.json(drivers.map(d => ({ ...d, areas: byDriver[d.id] || [] })));
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch teams", detail: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    const { driver_code, dropdown_user_id, names, phone, day_off, team, areas } = await request.json();

    if (!driver_code || !names || !phone || !day_off || !team) {
        return NextResponse.json({ error: "driver_code, names, phone, day_off, and team are required." }, { status: 400 });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const { rows } = await client.query(
            `INSERT INTO drivers (driver_code, dropdown_user_id, names, phone, day_off, team)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [driver_code, dropdown_user_id || null, names, phone, day_off, team]
        );
        const driverId = rows[0].id;
        for (const area of (areas || [])) {
            if (!area.trim()) continue;
            await client.query("INSERT INTO driver_areas (driver_id, area_name) VALUES ($1, $2)", [driverId, area.trim()]);
        }
        await client.query("COMMIT");
        return NextResponse.json({ ok: true, id: driverId });
    } catch (err) {
        await client.query("ROLLBACK");
        const status = err.code === "23505" ? 409 : 500; // unique_violation on driver_code
        return NextResponse.json({ error: "Failed to create driver", detail: err.message }, { status });
    } finally {
        client.release();
    }
}
