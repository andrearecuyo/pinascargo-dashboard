// Creates or updates a dashboard user. Usage:
//   node scripts/create-user.mjs <email> <password> <role>
// role must be "admin" or "marketing".
import fs from "fs";
import pg from "pg";
import bcrypt from "bcryptjs";

const [, , email, password, role] = process.argv;

if (!email || !password || !role) {
    console.error("Usage: node scripts/create-user.mjs <email> <password> <role: admin|marketing>");
    process.exit(1);
}
if (!["admin", "marketing"].includes(role)) {
    console.error("role must be 'admin' or 'marketing'");
    process.exit(1);
}

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

try {
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $3
         RETURNING id, email, role`,
        [email.toLowerCase().trim(), password_hash, role]
    );
    console.log("User ready:", rows[0]);
} catch (err) {
    console.error("Failed:", err.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
