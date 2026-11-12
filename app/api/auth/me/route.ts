import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getUserId } from "../../../../lib/userAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const id = getUserId();
  if (!id) return NextResponse.json({ user: null });
  try {
    const { rows } = await pool.query("SELECT name, phone FROM users WHERE id = $1", [id]);
    return NextResponse.json({ user: rows[0] ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ user: null });
  }
}
