import { FIXED1, FORM_SIZES, HEX, OCC, PTYPE, SLOTS, SPEC, SUBCATS } from "./catalog";

export const DISPATCH = ["1-2 days", "3 days", "5 days", "7 days"];
export const ORIGINS = ["India", "China", "Bangladesh", "Other"];
export const GST_RATES = ["Not sure", "0%", "5%", "12%", "18%"];
export const RETURN_PERIODS = ["7 days", "10 days", "15 days"];

export type Parsed = Record<string, unknown>;
type R = { error: string } | { data: Parsed };

const isCloud = (u: unknown): u is string => typeof u === "string" && u.length < 500 && /^https:\/\/res\.cloudinary\.com\//.test(u);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
const int = (v: unknown, min: number, max: number) => { const n = num(v); return Number.isInteger(n) && n >= min && n <= max ? n : null; };
const list = (v: unknown, allowed: string[], max = 20) =>
  Array.isArray(v) ? [...new Set(v.map(String))].filter((x) => allowed.includes(x)).slice(0, max) : [];

export function parseProduct(b: Record<string, unknown>): R {
  const category = str(b.category, 40), sub = str(b.sub_category, 40), ptype = str(b.product_type, 60);
  if (!SUBCATS[category]) return { error: "Choose a category" };
  if (!SUBCATS[category].includes(sub)) return { error: "Choose a sub category" };
  if (!PTYPE[category].includes(ptype)) return { error: "Choose a product type" };

  const name = str(b.name, 120), sku = str(b.sku, 40), description = str(b.description, 1000);
  if (name.length < 3) return { error: "Enter the product name" };
  if (!sku) return { error: "Enter the SKU / product code" };
  if (description.length < 10) return { error: "Write at least 10 characters in the description" };
  const packageContents = str(b.package_contents, 120);
  if (!packageContents) return { error: "Enter the package contents" };

  const highlights = Array.isArray(b.highlights) ? b.highlights.map((x) => str(x, 60)).filter(Boolean).slice(0, 5) : [];
  const occasion = list(b.occasion, OCC);

  // category specifications
  const inAttrs = (b.attributes && typeof b.attributes === "object" ? b.attributes : {}) as Record<string, unknown>;
  const attrs: Record<string, string> = {};
  for (const [key, label, type, opts, req, showIf] of SPEC[category]) {
    if (showIf && !Object.entries(showIf).every(([k, v]) => attrs[k] === v)) continue;
    const raw = inAttrs[key];
    const v = typeof raw === "number" ? String(raw) : str(raw, 60);
    if (!v) { if (req) return { error: `${label} is required` }; continue; }
    if (type === "s" || type === "c") { if (!(opts as string[]).includes(v)) return { error: `Choose a valid ${label}` }; }
    else if (type === "y") { if (v !== "Yes" && v !== "No") return { error: `Choose Yes or No for ${label}` }; }
    else { const n = Number(v); if (!(n > 0 && n <= 100)) return { error: `Enter a valid ${label}` }; }
    attrs[key] = v;
  }

  // sizes, stock, colours
  const fixed = FIXED1(category);
  let sizes: string[] = [], stockBySize: Record<string, number> = {}, colors: string[] = [];
  if (fixed) {
    const st = int(b.stock, 0, 100000);
    if (st === null) return { error: "Enter the available stock" };
    sizes = ["Free Size"]; stockBySize = { "Free Size": st };
    colors = attrs.color && HEX[attrs.color] ? [attrs.color] : [];
  } else {
    const inS = (b.stock_by_size && typeof b.stock_by_size === "object" ? b.stock_by_size : {}) as Record<string, unknown>;
    sizes = FORM_SIZES.filter((z) => z in inS);
    if (!sizes.length) return { error: "Choose at least one size" };
    for (const z of sizes) {
      const n = int(inS[z], 0, 100000);
      if (n === null) return { error: `Enter stock for size ${z}` };
      stockBySize[z] = n;
    }
    colors = list(b.colors, Object.keys(HEX));
    if (!colors.length) return { error: "Choose at least one colour" };
  }
  const stock = Object.values(stockBySize).reduce((a, n) => a + n, 0);

  // photos
  const slotKeys = SLOTS(category).map((s) => s[0]);
  const inI = (b.images && typeof b.images === "object" ? b.images : {}) as Record<string, unknown>;
  const slots: Record<string, string> = {};
  for (const k of slotKeys) if (isCloud(inI[k])) slots[k] = inI[k] as string;
  if (!slots.main) return { error: "Upload the main image" };
  if (Object.keys(slots).length < 3) return { error: "Upload at least 3 photos (main + 2 more)" };
  const colorImages: Record<string, string> = {};
  if (colors.length > 1) {
    const inC = (b.color_images && typeof b.color_images === "object" ? b.color_images : {}) as Record<string, unknown>;
    for (const c of colors) {
      if (!isCloud(inC[c])) return { error: `Upload a photo for the colour ${c}` };
      colorImages[c] = inC[c] as string;
    }
  }
  const video = b.video_url ? (isCloud(b.video_url) ? (b.video_url as string) : null) : null;

  // price
  const mrp = int(b.mrp, 1, 1000000), price = int(b.price, 1, 1000000);
  if (mrp === null) return { error: "Enter the MRP" };
  if (price === null) return { error: "Enter the selling price" };
  if (price > mrp) return { error: "Selling price must not be more than MRP" };
  const buy = b.purchase_price === "" || b.purchase_price == null ? null : int(b.purchase_price, 0, 1000000);
  const hsn = str(b.hsn, 8);
  if (hsn && !/^\d{4,8}$/.test(hsn)) return { error: "HSN code must be 4 to 8 digits" };
  const gst = str(b.gst_rate, 10);
  if (gst && !GST_RATES.includes(gst)) return { error: "Choose a valid GST rate" };
  const minQ = int(b.min_qty, 1, 50), maxQ = int(b.max_qty, 1, 50);
  if (minQ === null || maxQ === null || maxQ < minQ) return { error: "Check minimum and maximum order quantity" };

  // shipping
  const kg = num(b.weight_kg);
  if (!(kg > 0 && kg <= 20)) return { error: "Enter the weight in kg" };
  const dims = [num(b.pkg_length_cm), num(b.pkg_width_cm), num(b.pkg_height_cm)];
  if (!dims.every((d) => d > 0 && d <= 200)) return { error: "Enter package length, width and height in cm" };
  const dispatch = str(b.dispatch_time, 20), origin = str(b.country_of_origin, 30);
  if (!DISPATCH.includes(dispatch)) return { error: "Choose the dispatch time" };
  if (!ORIGINS.includes(origin)) return { error: "Choose the country of origin" };

  // return
  const retAv = b.return_available === true, exch = b.exchange_available === true;
  const retPer = str(b.return_period, 20);
  if (retAv && !RETURN_PERIODS.includes(retPer)) return { error: "Choose the return period" };

  // legal
  const mfr = str(b.mfr_name, 100), mfrAddr = str(b.mfr_address, 250);
  if (mfr.length < 2) return { error: "Enter the manufacturer / packer name" };
  if (mfrAddr.length < 8) return { error: "Enter the manufacturer / packer address" };
  if (b.declaration !== true) return { error: "Please accept the seller declaration" };

  return { data: {
    name, category, sub_category: sub, product_type: ptype, brand: str(b.brand, 60) || null, sku, description,
    highlights, occasion, attributes: JSON.stringify(attrs), package_contents: packageContents,
    composition: str(b.composition, 80) || null, model_info: fixed ? null : str(b.model_info, 80) || null, keywords: str(b.keywords, 120) || null,
    price, old_price: mrp, purchase_price: buy, hsn: hsn || null, gst_rate: gst || null, min_qty: minQ, max_qty: maxQ,
    image: slots.main, images: slotKeys.filter((k) => slots[k]).map((k) => slots[k]),
    image_slots: JSON.stringify(slots), color_images: JSON.stringify(colorImages), video_url: video,
    sizes, colors, stock_by_size: JSON.stringify(stockBySize), stock,
    weight_g: Math.round(kg * 1000), pkg_length_cm: dims[0], pkg_width_cm: dims[1], pkg_height_cm: dims[2],
    dispatch_time: dispatch, country_of_origin: origin,
    return_available: retAv, exchange_available: exch, return_period: retAv ? retPer : null,
    return_policy: str(b.return_policy, 400) || null, mfr_name: mfr, mfr_address: mfrAddr,
  } };
}
