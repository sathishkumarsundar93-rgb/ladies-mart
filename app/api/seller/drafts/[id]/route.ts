import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { getSeller } from "../../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await pool.query("DELETE FROM product_drafts WHERE id = $1 AND seller_id = $2", [id, s.id]);
  return NextResponse.json({ ok: true });
}
