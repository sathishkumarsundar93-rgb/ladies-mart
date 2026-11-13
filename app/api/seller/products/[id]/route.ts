import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { getSeller } from "../../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved" }, { status: 403 });
  const id = Number(params.id);
  let b: { price?: number; old_price?: number; active?: boolean; stock?: number; stock_by_size?: Record<string, number> } = {};
  try { b = await req.json(); } catch {}
  const okInt = (v: unknown, max: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max;
  if (!Number.isInteger(id) || !okInt(b.price, 1000000) || !okInt(b.old_price, 1000000) || typeof b.active !== "boolean"
      || (b.price as number) < 1 || (b.old_price as number) < (b.price as number))
    return NextResponse.json({ error: "Invalid values (MRP must be equal or more than price)" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cur = await client.query("SELECT stock_by_size FROM products WHERE id = $1 AND seller_id = $2 FOR UPDATE", [id, s.id]);
    if (!cur.rows.length) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Not found" }, { status: 404 }); }
    const had: Record<string, number> = cur.rows[0].stock_by_size || {};
    let sbs: Record<string, number> | null = null, total: number;
    if (Object.keys(had).length) {
      const inS = b.stock_by_size || {};
      sbs = {};
      for (const z of Object.keys(had)) {
        if (!okInt(inS[z], 100000)) { await client.query("ROLLBACK"); return NextResponse.json({ error: `Enter stock for size ${z}` }, { status: 400 }); }
        sbs[z] = inS[z];
      }
      total = Object.values(sbs).reduce((a, n) => a + n, 0);
    } else {
      if (!okInt(b.stock, 100000)) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Enter the stock" }, { status: 400 }); }
      total = b.stock as number;
    }
    await client.query(
      `UPDATE products SET price = $1, old_price = $2, active = $3, stock = $4,
         stock_by_size = COALESCE($5::jsonb, stock_by_size) WHERE id = $6`,
      [b.price, b.old_price, b.active, total, sbs ? JSON.stringify(sbs) : null, id]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally { client.release(); }
                                               }
