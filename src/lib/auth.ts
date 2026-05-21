import { cookies } from "next/headers";

export const ADMIN_COOKIE = "utm-gen-admin";

export async function isAuthed(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  return Boolean(expected && token === expected);
}
