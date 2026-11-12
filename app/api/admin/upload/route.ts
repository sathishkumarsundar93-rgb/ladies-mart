import crypto from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret)
    return NextResponse.json({ error: "Cloudinary is not configured on the server" }, { status: 500 });

  let file: FormDataEntryValue | null = null;
  try { file = (await req.formData()).get("file"); } catch {}
  if (!(file instanceof File)) return NextResponse.json({ error: "No image received" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 400 });

  const folder = "ladies-mart";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", key);
  fd.append("timestamp", timestamp);
  fd.append("folder", folder);
  fd.append("signature", signature);

  try {
    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
    const d = await r.json();
    if (!r.ok) return NextResponse.json({ error: d?.error?.message || "Upload failed" }, { status: 502 });
    return NextResponse.json({ url: d.secure_url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
