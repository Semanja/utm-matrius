import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();

  const expected = process.env.ADMIN_PASSWORD;
  const token = process.env.ADMIN_SESSION_TOKEN;

  if (!expected || !token) {
    return NextResponse.json(
      { error: "Сервер не настроен (отсутствуют ADMIN_PASSWORD/ADMIN_SESSION_TOKEN)" },
      { status: 500 }
    );
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  });
  return res;
}
