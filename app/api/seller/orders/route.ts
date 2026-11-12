import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getSeller } from "../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  try {
    const items = await pool.query(
      `SELECT i.id AS item_id, i.name, i.size, i.qty, i.price, i.item_status, i.tracking,
              o.order_no, o.status AS order_status, o.created_at, o.customer_name, o.phone,
              o.address, o.city, o.pincode, o.payment_method
       FROM order_items i JOIN orders o ON o.id = i.order_id
       WHERE i.seller_id = $1 ORDER BY i.id DESC LIMIT 200`, [s.id]);
    const e = await pool.query(
      `SELECT COALESCE(SUM(i.price * i.qty) FILTER (WHERE o.status = 'delivered'), 0) AS delivered_sales,
              COALESCE(SUM(i.price * i.qty * i.commission_pct / 100.0) FILTER (WHERE o.status = 'delivered'), 0) AS commission,
              COALESCE(SUM(i.price * i.qty) FILTER (WHERE o.status IN ('pending','confirmed','shipped')), 0) AS in_progress
       FROM order_items i JOIN orders o ON o.id = i.order_id WHERE i.seller_id = $1`, [s.id]);
    const sales = Number(e.rows[0].delivered_sales);
    const commission = Math.round(Number(e.rows[0].commission));
    return NextResponse.json({
      items: items.rows,
      earnings: { sales, commission, payout: sales - commission, inProgress: Number(e.rows[0].in_progress), commissionPct: s.commission_pct },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  let b: { itemId?: number; status?: string; tracking?: string } = {};
  try { b = await req.json(); } catch {}
  const tracking = typeof b.tracking === "string" ? b.tracking.trim().slice(0, 60) : "";
  if (!Number.isInteger(b.itemId) || !["pending", "packed", "shipped"].includes(String(b.status)))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const r = await pool.query(
      `UPDATE order_items i SET item_status = $1, tracking = COALESCE(NULLIF($2, ''), i.tracking)
       FROM orders o WHERE i.id = $3 AND i.seller_id = $4 AND o.id = i.order_id AND o.status <> 'cancelled'`,
      [b.status, tracking, b.itemId, s.id]);
    if (!r.rowCount) return NextResponse.json({ error: "Order not found or cancelled" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
