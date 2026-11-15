import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { isAdmin } from "../../../../../lib/adminAuth";

export const dynamic = "force-dynamic";
const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  let status = "";
  try { status = String((await req.json()).status ?? ""); } catch {}
  if (!Number.isInteger(id) || !STATUSES.includes(status))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cur = await client.query("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [id]);
    if (!cur.rows.length) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Not found" }, { status: 404 }); }
    const old: string = cur.rows[0].status;
    if (old === "cancelled" && status !== "cancelled") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Cancelled orders cannot be reopened" }, { status: 400 });
    }
    if (status === "cancelled" && old !== "cancelled") {
      const its = await client.query("SELECT product_id, size, color, qty FROM order_items WHERE order_id = $1", [id]);
      const touched = new Set<number>();
      for (const it of its.rows) {
        const pr = await client.query("SELECT stock_by_size, variant_stock FROM products WHERE id = $1 FOR UPDATE", [it.product_id]);
        if (!pr.rows.length) continue;
        const sbs: Record<string, number> = pr.rows[0].stock_by_size || {};
        const vs: Record<string, Record<string, number>> = pr.rows[0].variant_stock || {};
        if (Object.keys(vs).length) {
          vs[it.color] = vs[it.color] || {};
          vs[it.color][it.size] = Number(vs[it.color][it.size] ?? 0) + it.qty;
          const bySize: Record<string, number> = {};
          for (const row of Object.values(vs)) for (const [z, n] of Object.entries(row)) bySize[z] = (bySize[z] ?? 0) + n;
          const total = Object.values(bySize).reduce((a, n) => a + n, 0);
          await client.query("UPDATE products SET variant_stock = $2::jsonb, stock_by_size = $3::jsonb, stock = $4 WHERE id = $1", [it.product_id, JSON.stringify(vs), JSON.stringify(bySize), total]);
        } else if (Object.keys(sbs).length) {
          await client.query(
            "UPDATE products SET stock_by_size = jsonb_set(stock_by_size, ARRAY[$2]::text[], to_jsonb($3::int)) WHERE id = $1",
            [it.product_id, it.size, Number(sbs[it.size] ?? 0) + it.qty]);
          touched.add(it.product_id);
        } else {
          await client.query("UPDATE products SET stock = stock + $1 WHERE id = $2", [it.qty, it.product_id]);
        }
      }
      if (touched.size) {
        await client.query(
          "UPDATE products SET stock = (SELECT COALESCE(SUM(value::int), 0) FROM jsonb_each_text(stock_by_size)) WHERE id = ANY($1::int[])",
          [[...touched]]);
      }
    }
    await client.query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally { client.release(); }
}
