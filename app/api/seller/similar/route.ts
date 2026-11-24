import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getSeller } from "../../../../lib/sellerAuth";
import { FIXED1, SLOTS } from "../../../../lib/catalog";
import { parseProduct } from "../../../../lib/productForm";

export const dynamic = "force-dynamic";

// Create a similar product by copying an existing product of the same seller.
// Only name, SKU, price, colour, photos and stock come from the seller. Everything else is copied.
export async function POST(req: Request) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved yet" }, { status: 403 });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {}
  const from = Number(b.from);
  if (!Number.isInteger(from)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { rows } = await pool.query("SELECT * FROM products WHERE id = $1 AND seller_id = $2", [from, s.id]);
  const src = rows[0];
  if (!src) return NextResponse.json({ error: "Original product not found" }, { status: 404 });

  const fixed = FIXED1(src.category);
  const color = typeof b.color === "string" ? b.color : "";
  const photos = Array.isArray(b.photos) ? b.photos.map(String).slice(0, 5) : [];
  const slotKeys = SLOTS(src.category).map((x) => x[0]);
  const images: Record<string, string> = {};
  photos.forEach((u, i) => { if (slotKeys[i]) images[slotKeys[i]] = u; });
  const sbs = (b.stock_by_size && typeof b.stock_by_size === "object" ? b.stock_by_size : {}) as Record<string, unknown>;
  const attrs = { ...(src.attributes || {}) } as Record<string, string>;
  if (fixed) attrs.color = color;

  const body: Record<string, unknown> = {
    category: src.category, sub_category: src.sub_category, product_type: src.product_type,
    name: b.name, brand: src.brand ?? "", sku: b.sku, description: src.description, highlights: src.highlights, occasion: src.occasion,
    attributes: attrs, package_contents: src.package_contents, composition: src.composition ?? "", model_info: src.model_info ?? "", keywords: src.keywords ?? "",
    ...(fixed ? { stock: sbs["Free Size"] } : { stock_by_size: sbs, colors: [color] }),
    images, color_images: {}, video_url: "",
    mrp: b.mrp, price: b.price, purchase_price: src.purchase_price, hsn: src.hsn ?? "", gst_rate: src.gst_rate ?? "",
    min_qty: src.min_qty, max_qty: src.max_qty,
    weight_kg: Number(src.weight_g) / 1000, pkg_length_cm: Number(src.pkg_length_cm), pkg_width_cm: Number(src.pkg_width_cm), pkg_height_cm: Number(src.pkg_height_cm),
    dispatch_time: src.dispatch_time, country_of_origin: src.country_of_origin,
    return_available: src.return_available, exchange_available: src.exchange_available, return_period: src.return_period ?? "", return_policy: src.return_policy ?? "",
    mfr_name: src.mfr_name, mfr_address: src.mfr_address, declaration: b.declaration === true,
  };
  const r = parseProduct(body, { minPhotos: 1 });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });

  const gid: number = src.group_id ?? src.id;
  const row: Record<string, unknown> = { ...r.data, seller_id: s.id, approval: "pending", declared_at: new Date(), group_id: gid };
  const keys = Object.keys(row);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (!src.group_id) await client.query("UPDATE products SET group_id = $1 WHERE id = $1", [src.id]);
    const q = await client.query(
      `INSERT INTO products (${keys.join(", ")}) VALUES (${keys.map((_, i) => "$" + (i + 1)).join(", ")}) RETURNING id`,
      keys.map((k) => row[k]));
    await client.query("COMMIT");
    return NextResponse.json({ id: q.rows[0].id, group_id: gid });
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    if ((e as { code?: string }).code === "23505")
      return NextResponse.json({ error: "You already used this SKU / product code. Use a different code." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally { client.release(); }
}
