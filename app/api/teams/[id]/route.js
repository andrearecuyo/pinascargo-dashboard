import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db.js";

// Auth is enforced by middleware.js before these routes ever run.

export async function PUT(request, { params }) {
    const { id } = await params;
    const { driver_code, dropdown_user_id, names, phone, day_off, team, areas } = await request.json();

    if (!driver_code || !names || !phone || !day_off || !team) {
        return NextResponse.json({ error: "driver_code, names, phone, day_off, and team are required." }, { status: 400 });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const { rowCount } = await client.query(
            `UPDATE drivers SET driver_code=$1, dropdown_user_id=$2, names=$3, phone=$4, day_off=$5, team=$6
             WHERE id=$7`,
            [driver_code, dropdown_user_id || null, names, phone, day_off, team, id]
        );
        if (rowCount === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: "Driver not found." }, { status: 404 });
        }
        await client.query("DELETE FROM driver_areas WHERE driver_id = $1", [id]);
        for (const area of (areas || [])) {
            if (!area.trim()) continue;
            await client.query("INSERT INTO driver_areas (driver_id, area_name) VALUES ($1, $2)", [id, area.trim()]);
        }
        await client.query("COMMIT");
        return NextResponse.json({ ok: true });
    } catch (err) {
        await client.query("ROLLBACK");
        const status = err.code === "23505" ? 409 : 500;
        return NextResponse.json({ error: "Failed to update driver", detail: err.message }, { status });
    } finally {
        client.release();
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        const db = getDb();
        const { rowCount } = await db.query("DELETE FROM drivers WHERE id = $1", [id]);
        if (rowCount === 0) return NextResponse.json({ error: "Driver not found." }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to delete driver", detail: err.message }, { status: 500 });
    }
}
