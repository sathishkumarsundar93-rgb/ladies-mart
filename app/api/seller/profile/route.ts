import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getSellerId } from "../../../../lib/sellerAuth";
import { decrypt, encrypt, kycReady, maskTail } from "../../../../lib/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const id = getSellerId();
  if (!id) return NextResponse.json({ error: "Please login" }, { status: 401 });
  const { rows } = await pool.query("SELECT * FROM sellers WHERE id = $1", [id]);
  const s = rows[0];
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    pickup_address: s.pickup_address ?? "", pickup_city: s.pickup_city ?? "", pickup_pincode: s.pickup_pincode ?? "",
    support_phone: s.support_phone ?? "", pan: maskTail(decrypt(s.pan_enc)), gstin: s.gstin ?? "",
    bank_holder: s.bank_holder ?? "", bank_account: maskTail(decrypt(s.bank_account_enc)), bank_ifsc: s.bank_ifsc ?? "", upi_id: s.upi_id ?? "",
    kyc_status: s.kyc_status, kyc_note: s.kyc_note ?? "",
  });
}

export async function PUT(req: Request) {
  const id = getSellerId();
  if (!id) return NextResponse.json({ error: "Please login" }, { status: 401 });
  if (!kycReady()) return NextResponse.json({ error: "Secure storage is not set up on the server yet (KYC_KEY)" }, { status: 500 });
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch {}
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const bad = (m: string) => NextResponse.json({ error: m }, { status: 400 });

  const { rows } = await pool.query("SELECT * FROM sellers WHERE id = $1", [id]);
  const cur = rows[0];
  if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const addr = str(b.pickup_address, 250), city = str(b.pickup_city, 60), pin = str(b.pickup_pincode, 6);
  const phone = str(b.support_phone, 10).replace(/\s|-/g, "");
  if (addr.length < 10) return bad("Enter the full pickup address");
  if (city.length < 2) return bad("Enter the pickup city");
  if (!/^\d{6}$/.test(pin)) return bad("Enter a valid 6-digit pickup PIN code");
  if (!/^[6-9]\d{9}$/.test(phone)) return bad("Enter a valid 10-digit support phone");

  // PAN and account number: a masked value (with •) means "keep what is saved"
  const oldPan = decrypt(cur.pan_enc), oldAcc = decrypt(cur.bank_account_enc);
  const panIn = str(b.pan, 12).toUpperCase().replace(/\s/g, "");
  const accIn = str(b.bank_account, 20).replace(/\s/g, "");
  const pan = panIn.includes("•") || panIn === "" ? oldPan : panIn;
  const acc = accIn.includes("•") || accIn === "" ? oldAcc : accIn;
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return bad("Enter a valid PAN (example ABCDE1234F)");
  const gstin = str(b.gstin, 15).toUpperCase().replace(/\s/g, "");
  if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return bad("GSTIN looks wrong. Leave it empty if you are not GST registered.");
  const holder = str(b.bank_holder, 80), ifsc = str(b.bank_ifsc, 11).toUpperCase().replace(/\s/g, "");
  if (holder.length < 2) return bad("Enter the bank account holder name");
  if (!/^\d{9,18}$/.test(acc)) return bad("Enter a valid bank account number (9 to 18 digits)");
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return bad("Enter a valid IFSC code (example SBIN0001234)");
  const upi = str(b.upi_id, 60);
  if (upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi)) return bad("UPI ID looks wrong (example name@bank)");

  const sensitiveChanged = pan !== oldPan || acc !== oldAcc || gstin !== (cur.gstin ?? "") || ifsc !== (cur.bank_ifsc ?? "") || holder !== (cur.bank_holder ?? "");
  const resubmit = sensitiveChanged || cur.kyc_status === "incomplete" || cur.kyc_status === "rejected";
  const status = resubmit ? "submitted" : cur.kyc_status;
  try {
    await pool.query(
      `UPDATE sellers SET pickup_address = $1, pickup_city = $2, pickup_pincode = $3, support_phone = $4, pan_enc = $5, gstin = $6,
         bank_holder = $7, bank_account_enc = $8, bank_ifsc = $9, upi_id = $10, kyc_status = $11,
         kyc_note = CASE WHEN $12 THEN NULL ELSE kyc_note END,
         kyc_submitted_at = CASE WHEN $12 THEN NOW() ELSE kyc_submitted_at END WHERE id = $13`,
      [addr, city, pin, phone, encrypt(pan), gstin || null, holder, encrypt(acc), ifsc, upi || null, status, resubmit, id]);
    return NextResponse.json({ ok: true, kyc_status: status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
