import { Pool } from "pg";

const g = globalThis as unknown as { pgPool?: Pool };
const url = process.env.DATABASE_URL;

export const pool =
  g.pgPool ??
  new Pool({
    connectionString: url,
    max: 5,
    ssl: url && !url.includes("localhost") ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") g.pgPool = pool;
