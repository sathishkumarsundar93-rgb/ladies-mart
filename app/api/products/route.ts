import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { shape, type DbProduct } from "../../../lib/products";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  try {
    const { rows } = await pool.query<DbProduct>(
      `SELECT * FROM products
       WHERE active = TRUE AND approval = 'approved'
         AND ($1::text IS NULL OR category = $1)
         AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%')
       ORDER BY id`,
      [sp.get("category"), sp.get("q")]
    );
    return NextResponse.json(rows.map(shape));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
