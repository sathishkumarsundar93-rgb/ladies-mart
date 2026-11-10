import fs from "node:fs";
import pg from "pg";

// Load .env.local (Next.js style) without extra packages
for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL missing in .env.local"); process.exit(1); }

const pool = new pg.Pool({
  connectionString: url,
  ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
});

try {
  await pool.query(fs.readFileSync("db/schema.sql", "utf8"));
  const { rows } = await pool.query("SELECT COUNT(*) FROM products");
  console.log("Database ready. Products:", rows[0].count);
} catch (e) {
  console.error("Setup failed:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
