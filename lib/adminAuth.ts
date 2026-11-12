import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "lm_admin";
const secret = () => process.env.ADMIN_PASSWORD || "";
const sign = (exp: string) => crypto.createHmac("sha256", secret()).update(exp).digest("hex");
const hash = (s: string) => crypto.createHash("sha256").update(s).digest();

export function checkPassword(p: string) {
  if (!secret()) return false;
  return crypto.timingSafeEqual(hash(p), hash(secret()));
}

export function makeToken() {
  const exp = String(Date.now() + 7 * 24 * 3600 * 1000);
  return `${exp}.${sign(exp)}`;
}

export function isAdmin() {
  if (!secret()) return false;
  const t = cookies().get(COOKIE)?.value;
  if (!t) return false;
  const [exp, sig] = t.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
