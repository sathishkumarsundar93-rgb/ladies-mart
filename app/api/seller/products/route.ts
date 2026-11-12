import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getSeller } from "../../../../lib/sellerAuth";

export const dynamic = "force-dynamic";
const CATEGORIES = ["Sarees", "Kurtis", "Dresses", "Tops", "Jeans", "Ethnic Wear", "Nightwear"];

export async function GET() {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  const { rows } = await pool.query(
    "SELECT id, name, category, price, old_price, stock, active, approval FROM products WHERE seller_id = $1 ORDER BY id DESC", [s.id]);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved yet" }, { status: 403 });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {}
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const category = String(b.category ?? "");
  const image = String(b.image ?? "");
  const int = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : null);
  const price = int(b.price, 1000000), old_price = int(b.old_price, 1000000);
  const stock = int(b.stock, 100000), weight_g = int(b.weight_g, 20000);

  if (name.length < 3 || name.length > 120) return bad("Enter product name");
  if (!CATEGORIES.includes(category)) return bad("Choose a category");
  if (price === null || price < 1 || old_price === null || old_price < price) return bad("MRP must be equal or more than price");
  if (stock === null || weight_g === null || weight_g < 1) return bad("Check stock and weight");
  if (!/^https:\/\/res\.cloudinary\.com\//.test(image)) return bad("Upload a product photo");

  try {
    const r = await pool.query(
      `INSERT INTO products (name, category, price, old_price, image, stock, weight_g, seller_id, approval)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING id`,
      [name, category, price, old_price, image, stock, weight_g, s.id]);
    return NextResponse.json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
