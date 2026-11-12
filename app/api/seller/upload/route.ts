import { NextResponse } from "next/server";
import { getSeller } from "../../../../lib/sellerAuth";
import { uploadToCloudinary } from "../../../../lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const s = await getSeller();
  if (!s) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (s.status !== "approved") return NextResponse.json({ error: "Your account is not approved yet" }, { status: 403 });
  let file: FormDataEntryValue | null = null;
  try { file = (await req.formData()).get("file"); } catch {}
  if (!(file instanceof File)) return NextResponse.json({ error: "No image received" }, { status: 400 });
  const r = await uploadToCloudinary(file);
  if (!r.url) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ url: r.url });
}
