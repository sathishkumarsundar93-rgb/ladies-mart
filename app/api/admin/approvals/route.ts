import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.category, p.price, p.old_price, p.stock, p.image, s.name AS seller
     FROM products p LEFT JOIN sellers s ON s.id = p.seller_id
     WHERE p.approval = 'pending' ORDER BY p.id`);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let b: { id?: number; action?: string } = {};
  try { b = await req.json(); } catch {}
  if (!Number.isInteger(b.id) || !["approve", "reject"].includes(String(b.action)))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const r = await pool.query("UPDATE products SET approval = $1 WHERE id = $2 AND approval = 'pending'",
    [b.action === "approve" ? "approved" : "rejected", b.id]);
  if (!r.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
                                                                       }
