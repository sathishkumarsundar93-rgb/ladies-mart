import crypto from "crypto";

export async function uploadToCloudinary(file: File): Promise<{ url?: string; error?: string; status: number }> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return { error: "Cloudinary is not configured on the server", status: 500 };
  if (!file.type.startsWith("image/")) return { error: "Only images allowed", status: 400 };
  if (file.size > 5 * 1024 * 1024) return { error: "Image too large (max 5 MB)", status: 400 };

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
    if (!r.ok) return { error: d?.error?.message || "Upload failed", status: 502 };
    return { url: d.secure_url, status: 200 };
  } catch (e) {
    console.error(e);
    return { error: "Upload failed", status: 502 };
  }
}
