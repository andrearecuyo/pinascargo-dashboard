// One-off/idempotent schema setup, run manually with: node scripts/migrate.mjs
// This project has no migration framework — tables are created directly against DATABASE_URL.
import fs from "fs";
import pg from "pg";

const env = {};
for (const line of fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (m) env[m[1]] = m[2];
}

const { Pool } = pg;
const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false }
});

const SQL = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'marketing')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('link', 'multilink', 'vcard', 'applink')),
    target_url TEXT,
    company_name TEXT,
    tagline TEXT,
    logo_url TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    website TEXT,
    contact_name TEXT,
    job_title TEXT,
    ios_url TEXT,
    android_url TEXT,
    fallback_url TEXT,
    fg_color TEXT NOT NULL DEFAULT '#000000',
    bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE qr_codes DROP CONSTRAINT IF EXISTS qr_codes_type_check;
ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_type_check CHECK (type IN ('link', 'multilink', 'vcard', 'applink'));
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS ios_url TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS android_url TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS fallback_url TEXT;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS fg_color TEXT NOT NULL DEFAULT '#000000';
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS bg_color TEXT NOT NULL DEFAULT '#FFFFFF';

CREATE TABLE IF NOT EXISTS qr_code_links (
    id SERIAL PRIMARY KEY,
    qr_code_id INTEGER NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);
`;

try {
    await pool.query(SQL);
    console.log("Migration applied: users, qr_codes, qr_code_links ready.");
} catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
