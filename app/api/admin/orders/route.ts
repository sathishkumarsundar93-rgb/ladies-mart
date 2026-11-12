import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const orders = await pool.query(
      `SELECT o.*, COALESCE(json_agg(json_build_object('name', i.name, 'size', i.size, 'qty', i.qty, 'price', i.price))
              FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
       GROUP BY o.id ORDER BY o.id DESC LIMIT 100`
    );
    const s = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status <> 'cancelled') AS n,
              COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0) AS sales,
              COUNT(*) FILTER (WHERE status = 'pending') AS pending FROM orders`
    );
    const low = await pool.query("SELECT COUNT(*) AS n FROM products WHERE active = TRUE AND stock < 10");
    return NextResponse.json({
      orders: orders.rows,
      stats: {
        orders: Number(s.rows[0].n), sales: Number(s.rows[0].sales),
        pending: Number(s.rows[0].pending), lowStock: Number(low.rows[0].n),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
