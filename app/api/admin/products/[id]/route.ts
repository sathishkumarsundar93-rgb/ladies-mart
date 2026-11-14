import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { isAdmin } from "../../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const { rows } = await pool.query(
    "SELECT p.*, s.name AS seller_name FROM products p LEFT JOIN sellers s ON s.id = p.seller_id WHERE p.id = $1", [id]);
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  let b: { price?: number; old_price?: number; stock?: number; active?: boolean } = {};
  try { b = await req.json(); } catch {}
  const okInt = (v: unknown, max: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max;
  if (!Number.isInteger(id) || !okInt(b.price, 1000000) || !okInt(b.old_price, 1000000) || !okInt(b.stock, 100000) || typeof b.active !== "boolean")
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  try {
    const r = await pool.query(
      "UPDATE products SET price = $1, old_price = $2, stock = $3, active = $4 WHERE id = $5",
      [b.price, b.old_price, b.stock, b.active, id]);
    if (!r.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
  }
