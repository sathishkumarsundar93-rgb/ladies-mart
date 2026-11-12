import crypto from "crypto";
import { cookies } from "next/headers";

export const USER_COOKIE = "lm_user";
const secret = () => process.env.SESSION_SECRET || "";
export const sessionReady = () => secret().length >= 16;
const sign = (s: string) => crypto.createHmac("sha256", secret()).update(s).digest("hex");

export const cookieOpts = (maxAge: number) => ({
  httpOnly: true, sameSite: "lax" as const, path: "/",
  secure: process.env.NODE_ENV === "production", maxAge,
});

export function hashPassword(p: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(p, salt, 64).toString("hex")}`;
}

export function verifyPassword(p: string, stored: string) {
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  const test = crypto.scryptSync(p, salt, 64);
  const real = Buffer.from(h, "hex");
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

export function makeUserToken(id: number) {
  const payload = `${id}.${Date.now() + 30 * 24 * 3600 * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function getUserId(): number | null {
  if (!sessionReady()) return null;
  const t = cookies().get(USER_COOKIE)?.value;
  const parts = t ? t.split(".") : [];
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const good = sign(`${id}.${exp}`);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Number(exp) < Date.now()) return null;
  const n = Number(id);
  return Number.isInteger(n) ? n : null;
}
