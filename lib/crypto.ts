import crypto from "crypto";

// PAN and bank account numbers are stored encrypted (AES-256-GCM). The key comes from the KYC_KEY environment variable.
const key = () => {
  const k = process.env.KYC_KEY || "";
  return k.length >= 24 ? crypto.createHash("sha256").update(k).digest() : null;
};
export const kycReady = () => key() !== null;

export function encrypt(text: string): string {
  const k = key();
  if (!k) throw new Error("KYC_KEY missing");
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decrypt(s: string | null): string {
  const k = key();
  if (!s || !k) return "";
  try {
    const [iv, tag, enc] = s.split(".").map((x) => Buffer.from(x, "base64"));
    const d = crypto.createDecipheriv("aes-256-gcm", k, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch { return ""; }
}

export const maskTail = (s: string, n = 4) => (s ? "•".repeat(Math.max(0, s.length - n)) + s.slice(-n) : "");
