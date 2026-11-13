import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getSeller } from "../../../../lib/sellerAuth";
import { COLOURS, SIZES, SUBCATS } from "../../../../lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  const { rows } = await pool.query(
    "SELECT id, name, category, price, old_price, stock, active, approval, image FROM products WHERE seller_id = $1 ORDER BY id DESC", [s.id]);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved yet" }, { status: 403 });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {}
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(b.name), category = str(b.category), sub = str(b.sub_category), description = str(b.description);
  const int = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : null);
  const price = int(b.price, 1000000), old_price = int(b.old_price, 1000000);
  const stock = int(b.stock, 100000), weight_g = int(b.weight_g, 20000);
  const uniq = (v: unknown) => (Array.isArray(v) ? [...new Set(v.map(String))] : []);
  const images = uniq(b.images), sizes = uniq(b.sizes), colors = uniq(b.colors);

  if (name.length < 3 || name.length > 120) return bad("Enter product name");
  if (!SUBCATS[category]) return bad("Choose a category");
  if (!SUBCATS[category].includes(sub)) return bad("Choose a sub category");
  if (price === null || price < 1 || old_price === null || old_price < price) return bad("Price must not be more than MRP");
  if (stock === null || weight_g === null || weight_g < 1) return bad("Check stock and weight");
  if (description.length < 10 || description.length > 600) return bad("Write 10 to 600 characters in description");
  if (sizes.length === 0 || !sizes.every((x) => SIZES.includes(x))) return bad("Choose at least one size");
  if (colors.length === 0 || !colors.every((x) => x in COLOURS)) return bad("Choose at least one colour");
  if (images.length < 1 || images.length > 5 || !images.every((u) => /^https:\/\/res\.cloudinary\.com\//.test(u))) return bad("Upload 1 to 5 product photos");

  try {
    const r = await pool.query(
      `INSERT INTO products (name, category, sub_category, description, price, old_price, image, images, stock, weight_g, seller_id, approval, sizes, colors)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,$13) RETURNING id`,
      [name, category, sub, description, price, old_price, images[0], images, stock, weight_g, s.id, sizes, colors]);
    return NextResponse.json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
