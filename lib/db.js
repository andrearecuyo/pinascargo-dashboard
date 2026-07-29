import pg from "pg";

const { Pool } = pg;

let pool;

export function getDb() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false }
        });
    }
    return pool;
}
