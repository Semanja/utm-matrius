import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "utm-gen-admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Защищаем /admin/* кроме /login
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(COOKIE)?.value;
    const expected = process.env.ADMIN_SESSION_TOKEN;

    if (!expected || token !== expected) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
