import { NextResponse } from "next/server";
import { USER_COOKIE, cookieOpts } from "../../../../lib/userAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, "", cookieOpts(0));
  return res;
}
