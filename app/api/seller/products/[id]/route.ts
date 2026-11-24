import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { getSeller } from "../../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const { rows } = await pool.query("SELECT * FROM products WHERE id = $1 AND seller_id = $2", [id, s.id]);
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

type Body = { price?: number; old_price?: number; active?: boolean; stock?: number; stock_by_size?: Record<string, number>; variant_stock?: Record<string, Record<string, number>> };

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved" }, { status: 403 });
  const id = Number(params.id);
  let b: Body = {};
  try { b = await req.json(); } catch {}
  const okInt = (v: unknown, max: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max;
  if (!Number.isInteger(id) || !okInt(b.price, 1000000) || !okInt(b.old_price, 1000000) || typeof b.active !== "boolean"
      || (b.price as number) < 1 || (b.old_price as number) < (b.price as number))
    return NextResponse.json({ error: "Invalid values (MRP must be equal or more than price)" }, { status: 400 });

  const client = await pool.connect();
  const fail = async (msg: string) => { await client.query("ROLLBACK"); return NextResponse.json({ error: msg }, { status: 400 }); };
  try {
    await client.query("BEGIN");
    const cur = await client.query("SELECT stock_by_size, variant_stock FROM products WHERE id = $1 AND seller_id = $2 FOR UPDATE", [id, s.id]);
    if (!cur.rows.length) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Not found" }, { status: 404 }); }
    const had: Record<string, number> = cur.rows[0].stock_by_size || {};
    const hadV: Record<string, Record<string, number>> = cur.rows[0].variant_stock || {};
    let sbs: Record<string, number> | null = null, vsOut: Record<string, Record<string, number>> | null = null, total: number;

    if (Object.keys(hadV).length) {
      // colour variants: stock for every colour and size
      const inV = b.variant_stock || {};
      const totals: Record<string, number> = {};
      vsOut = {};
      for (const c of Object.keys(hadV)) {
        vsOut[c] = {};
        for (const z of Object.keys(hadV[c])) {
          const n = inV[c]?.[z];
          if (!okInt(n, 100000)) return await fail(`Enter stock for ${c} size ${z}`);
          vsOut[c][z] = n as number;
          totals[z] = (totals[z] ?? 0) + (n as number);
        }
      }
      sbs = totals;
      total = Object.values(totals).reduce((a, n) => a + n, 0);
    } else if (Object.keys(had).length) {
      const inS = b.stock_by_size || {};
      const out: Record<string, number> = {};
      for (const z of Object.keys(had)) {
        const n = inS[z];
        if (!okInt(n, 100000)) return await fail(`Enter stock for size ${z}`);
        out[z] = n;
      }
      sbs = out;
      total = Object.values(out).reduce((a, n) => a + n, 0);
    } else {
      if (!okInt(b.stock, 100000)) return await fail("Enter the stock");
      total = b.stock as number;
    }

    await client.query(
      `UPDATE products SET price = $1, old_price = $2, active = $3, stock = $4,
         stock_by_size = COALESCE($5::jsonb, stock_by_size), variant_stock = COALESCE($6::jsonb, variant_stock) WHERE id = $7`,
      [b.price, b.old_price, b.active, total, sbs ? JSON.stringify(sbs) : null, vsOut ? JSON.stringify(vsOut) : null, id]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally { client.release(); }
          }
