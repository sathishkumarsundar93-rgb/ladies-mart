import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { isAdmin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await pool.query("SELECT id, name, category, price, old_price, stock, active FROM products ORDER BY id");
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
