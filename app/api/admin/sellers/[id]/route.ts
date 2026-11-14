import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { isAdmin } from "../../../../../lib/adminAuth";
import { decrypt } from "../../../../../lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const { rows } = await pool.query("SELECT * FROM sellers WHERE id = $1", [id]);
  const s = rows[0];
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: s.id, name: s.name, owner_name: s.owner_name, phone: s.phone, status: s.status, kyc_status: s.kyc_status, kyc_note: s.kyc_note ?? "",
    pickup_address: s.pickup_address ?? "", pickup_city: s.pickup_city ?? "", pickup_pincode: s.pickup_pincode ?? "", support_phone: s.support_phone ?? "",
    pan: decrypt(s.pan_enc), gstin: s.gstin ?? "", bank_holder: s.bank_holder ?? "", bank_account: decrypt(s.bank_account_enc),
    bank_ifsc: s.bank_ifsc ?? "", upi_id: s.upi_id ?? "", kyc_submitted_at: s.kyc_submitted_at,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  let b: { action?: string; note?: string } = {};
  try { b = await req.json(); } catch {}
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 200) : "";
  if (!Number.isInteger(id) || !["verify", "reject"].includes(String(b.action))) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (b.action === "reject" && !note) return NextResponse.json({ error: "Write the reason so the seller can fix it" }, { status: 400 });
  const r = await pool.query(
    "UPDATE sellers SET kyc_status = $1, kyc_note = $2 WHERE id = $3 AND kyc_status = 'submitted'",
    [b.action === "verify" ? "verified" : "rejected", b.action === "verify" ? null : note, id]);
  if (!r.rowCount) return NextResponse.json({ error: "No KYC waiting for review" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
