import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";
const CATEGORIES = ["Sarees", "Kurtis", "Dresses", "Tops", "Jeans", "Ethnic Wear", "Nightwear"];

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool.query("SELECT id, name, category, price, old_price, stock, active FROM products ORDER BY id");
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      `INSERT INTO products (name, category, price, old_price, image, stock, weight_g)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [name, category, price, old_price, image, stock, weight_g]);
    return NextResponse.json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
