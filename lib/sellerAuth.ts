import crypto from "crypto";
import { cookies } from "next/headers";
import { pool } from "./db";

export const SELLER_COOKIE = "lm_seller";
const secret = () => process.env.SESSION_SECRET || "";
const sign = (s: string) => crypto.createHmac("sha256", secret()).update(s).digest("hex");

export type Seller = { id: number; name: string; owner_name: string; phone: string; status: string; commission_pct: number };

export function makeSellerToken(id: number) {
  const payload = `${id}.${Date.now() + 30 * 24 * 3600 * 1000}`;
  return `${payload}.${sign("seller." + payload)}`;
}

export function getSellerId(): number | null {
  if (secret().length < 16) return null;
  const t = cookies().get(SELLER_COOKIE)?.value;
  const parts = t ? t.split(".") : [];
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const good = sign(`seller.${id}.${exp}`);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Number(exp) < Date.now()) return null;
  const n = Number(id);
  return Number.isInteger(n) ? n : null;
}

export async function getSeller(): Promise<Seller | null> {
  const id = getSellerId();
  if (!id) return null;
  const { rows } = await pool.query(
    "SELECT id, name, owner_name, phone, status, commission_pct FROM sellers WHERE id = $1", [id]);
  return rows[0] ?? null;
}
