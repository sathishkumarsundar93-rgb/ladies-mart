import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { shippingFor } from "../../../lib/shipping";
import { getUserId } from "../../../lib/userAuth";
import { SIZES } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

class BadRequest extends Error {}

type Body = {
  name?: string; phone?: string; address?: string; city?: string; pincode?: string;
  items?: { id?: number; size?: string; color?: string; qty?: number }[];
};
type Line = { id: number; size: string; color: string; qty: number };
type Prod = { id: number; name: string; price: number; stock: number; seller_id: number | null; commission_pct: number; sizes: string[] | null; colors: string[] | null; stock_by_size: Record<string, number> | null; min_qty: number | null; max_qty: number | null };

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = clean(body.name), phone = clean(body.phone).replace(/\s|-/g, "");
  const address = clean(body.address), city = clean(body.city), pincode = clean(body.pincode);

  if (name.length < 2 || name.length > 80) return bad("Please enter your full name");
  if (!/^[6-9]\d{9}$/.test(phone)) return bad("Enter a valid 10-digit mobile number");
  if (address.length < 5 || address.length > 300) return bad("Please enter your full address");
  if (city.length < 2 || city.length > 60) return bad("Please enter your city");
  if (!/^\d{6}$/.test(pincode)) return bad("Enter a valid 6-digit PIN code");

  const raw = Array.isArray(body.items) ? body.items : [];
  if (raw.length === 0 || raw.length > 20) return bad("Your bag is empty");

  // merge duplicates + validate
  const lines = new Map<string, Line>();
  for (const i of raw) {
    const id = Number(i.id), qty = Number(i.qty), size = clean(i.size), color = clean(i.color);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 10 || !SIZES.includes(size) || color.length > 30)
      return bad("Invalid item in bag");
    const k = `${id}|${size}|${color}`;
    const old = lines.get(k);
    lines.set(k, { id, size, color, qty: Math.min(10, (old?.qty ?? 0) + qty) });
  }
  const list = [...lines.values()];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ids = [...new Set(list.map((l) => l.id))];
    const { rows } = await client.query(
      `SELECT p.id, p.name, p.price, p.stock, p.seller_id, COALESCE(s.commission_pct, 0) AS commission_pct, p.sizes, p.colors, p.stock_by_size, p.min_qty, p.max_qty
       FROM products p LEFT JOIN sellers s ON s.id = p.seller_id
       WHERE p.id = ANY($1::int[]) AND p.active = TRUE AND p.approval = 'approved' FOR UPDATE OF p`,
      [ids]
    );
    const byId = new Map<number, Prod>(rows.map((r) => [r.id, r]));

    // price, stock and options come from the database only
    const need = new Map<number, number>();
    const needSize = new Map<string, number>();
    let subtotal = 0;
    for (const l of list) {
      const p = byId.get(l.id);
      if (!p) throw new BadRequest("A product in your bag is no longer available");
      const sizes = p.sizes && p.sizes.length ? p.sizes : SIZES;
      if (!sizes.includes(l.size)) throw new BadRequest(`Selected size is not available for ${p.name}`);
      if (p.colors && p.colors.length) {
        if (!p.colors.includes(l.color)) throw new BadRequest(`Please choose a colour for ${p.name}`);
      } else if (l.color) throw new BadRequest(`Invalid colour for ${p.name}`);
      need.set(l.id, (need.get(l.id) ?? 0) + l.qty);
      needSize.set(`${l.id}|${l.size}`, (needSize.get(`${l.id}|${l.size}`) ?? 0) + l.qty);
      subtotal += p.price * l.qty;
    }
    const sized = (p: Prod) => !!p.stock_by_size && Object.keys(p.stock_by_size).length > 0;
    for (const [key, qty] of needSize) {
      const [pid, size] = key.split("|");
      const p = byId.get(Number(pid))!;
      if (!sized(p)) continue;
      const avail = Number(p.stock_by_size![size] ?? 0);
      if (avail < qty) throw new BadRequest(avail > 0 ? `Only ${avail} left in size ${size} for ${p.name}` : `Size ${size} of ${p.name} is sold out`);
    }
    for (const [id, qty] of need) {
      const p = byId.get(id)!;
      if (qty > (p.max_qty ?? 10)) throw new BadRequest(`You can buy at most ${p.max_qty ?? 10} of ${p.name} in one order`);
      if (qty < (p.min_qty ?? 1)) throw new BadRequest(`Minimum order quantity for ${p.name} is ${p.min_qty}`);
      if (!sized(p) && p.stock < qty) throw new BadRequest(`Only ${p.stock} left for ${p.name}`);
    }

    const shipping = shippingFor(subtotal);
    const total = subtotal + shipping;

    const o = await client.query(
      `INSERT INTO orders (customer_name, phone, address, city, pincode, payment_method, subtotal, shipping, total, user_id)
       VALUES ($1,$2,$3,$4,$5,'COD',$6,$7,$8,$9) RETURNING id`,
      [name, phone, address, city, pincode, subtotal, shipping, total, getUserId()]
    );
    const orderId: number = o.rows[0].id;
    const orderNo = `LM${1000 + orderId}`;
    await client.query("UPDATE orders SET order_no = $1 WHERE id = $2", [orderNo, orderId]);

    for (const l of list) {
      const p = byId.get(l.id)!;
      await client.query(
        "INSERT INTO order_items (order_id, product_id, name, price, size, color, qty, seller_id, commission_pct) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [orderId, p.id, p.name, p.price, l.size, l.color, l.qty, p.seller_id, p.commission_pct]
      );
    }
    const touched = new Set<number>();
    for (const [key, qty] of needSize) {
      const [pid, size] = key.split("|");
      const p = byId.get(Number(pid))!;
      if (!sized(p)) continue;
      const left = Number(p.stock_by_size![size] ?? 0) - qty;
      await client.query("UPDATE products SET stock_by_size = jsonb_set(stock_by_size, ARRAY[$2]::text[], to_jsonb($3::int)) WHERE id = $1", [p.id, size, left]);
      touched.add(p.id);
    }
    for (const [id, qty] of need) {
      if (!sized(byId.get(id)!)) await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [qty, id]);
    }
    if (touched.size) {
      await client.query(
        "UPDATE products SET stock = (SELECT COALESCE(SUM(value::int), 0) FROM jsonb_each_text(stock_by_size)) WHERE id = ANY($1::int[])",
        [[...touched]]);
    }

    await client.query("COMMIT");
    return NextResponse.json({ orderNo, subtotal, shipping, total });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    if (e instanceof BadRequest) return bad(e.message);
    console.error(e);
    return NextResponse.json({ error: "Could not place order. Please try again." }, { status: 500 });
  } finally {
    client.release();
  }
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Logged-in customer's own orders
export async function GET() {
  const uid = getUserId();
  if (!uid) return NextResponse.json({ error: "Please login" }, { status: 401 });
  try {
    const { rows } = await pool.query(
      `SELECT o.order_no, o.total, o.status, o.created_at,
              COALESCE(json_agg(json_build_object('name', i.name, 'size', i.size, 'qty', i.qty))
                FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
       WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.id DESC LIMIT 50`, [uid]);
    return NextResponse.json({ orders: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
