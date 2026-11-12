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
      await client.query(
        `UPDATE products p SET stock = p.stock + x.q
         FROM (SELECT product_id, SUM(qty)::int AS q FROM order_items WHERE order_id = $1 GROUP BY product_id) x
         WHERE p.id = x.product_id`, [id]);
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
