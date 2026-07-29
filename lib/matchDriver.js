import { getDb } from "./db.js";

// Maps the "City" dropdown value to the driver roster's team grouping.
// Kept in sync with the same map in the pinascargo-proxy Express app.
export const CITY_TEAM_MAP = {
    "DUBAI": "DUBAI",
    "ABU DHABI": "ABU DHABI",
    "SHARJAH": "SHARJAH",
    "FUJAIRAH": "FUJAIRAH",
    "RAS AL KHAIMAH": "RAS AL KHAIMAH",
    "AL AIN": "AL AIN",
    "AJMAN": "SHARJAH",
    "UMM AL QUWAIN": "SHARJAH",
    "WESTERN REGION": "ABU DHABI"
};

export const normalize = s => (s || "").trim().toUpperCase().replace(/[.,]/g, "");

export async function matchDriver(city, areaText) {
    const team = CITY_TEAM_MAP[normalize(city)];
    if (!team || !areaText) return null;

    const db = getDb();
    const { rows } = await db.query(
        `SELECT d.id, d.driver_code, d.dropdown_user_id, d.names, d.phone, da.area_name
         FROM driver_areas da JOIN drivers d ON d.id = da.driver_id
         WHERE d.team = $1`,
        [team]
    );

    const input = normalize(areaText);
    let match = rows.find(r => normalize(r.area_name) === input);
    if (!match) match = rows.find(r => normalize(r.area_name).includes(input) || input.includes(normalize(r.area_name)));
    return match || null;
}

// Full free-text address, searched across ALL teams (no city to disambiguate).
// Returns every distinct driver whose area name appears in the address, longest/most
// specific area match first, so the caller can see when a result is ambiguous.
export async function matchDriverByAddress(addressText) {
    const input = normalize(addressText);
    if (!input) return [];

    const db = getDb();
    const { rows } = await db.query(
        `SELECT d.id, d.driver_code, d.dropdown_user_id, d.names, d.phone, d.team, da.area_name
         FROM driver_areas da JOIN drivers d ON d.id = da.driver_id`
    );

    const hits = rows
        .filter(r => input.includes(normalize(r.area_name)))
        .sort((a, b) => b.area_name.length - a.area_name.length);

    const seenDrivers = new Set();
    const matches = [];
    for (const hit of hits) {
        if (seenDrivers.has(hit.id)) continue;
        seenDrivers.add(hit.id);
        matches.push(hit);
    }
    return matches;
}
