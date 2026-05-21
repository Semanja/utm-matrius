import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

const COOKIE = "utm-gen-admin-company";

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await req.json();
  if (typeof slug !== "string") {
    return NextResponse.json({ error: "bad slug" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, slug, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
