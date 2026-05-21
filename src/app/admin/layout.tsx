import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import CompanySwitcher from "@/components/admin/CompanySwitcher";
import LogoutButton from "@/components/admin/LogoutButton";
import { getCompanies } from "@/db/queries";
import { getAdminCompany } from "@/lib/admin-company";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companies = await getCompanies();
  const current = await getAdminCompany();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-lg">
              Админка UTM
            </Link>
            <CompanySwitcher companies={companies} current={current} />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              ← к мастеру
            </Link>
            <LogoutButton />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <AdminNav />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
