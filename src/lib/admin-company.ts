import { cookies } from "next/headers";

const COOKIE = "utm-gen-admin-company";
const DEFAULT_SLUG = "matrius";

export async function getAdminCompany(): Promise<string> {
  const c = await cookies();
  return c.get(COOKIE)?.value || DEFAULT_SLUG;
}
