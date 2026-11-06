import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { shape, type DbProduct } from "../../../../lib/products";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const { rows } = await pool.query<DbProduct>(
      "SELECT * FROM products WHERE id = $1 AND active = TRUE", [id]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(shape(rows[0]));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
