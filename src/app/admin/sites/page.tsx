import { db } from "@/db/client";
import { getAdminCompany } from "@/lib/admin-company";
import SitesTable from "./SitesTable";

type SiteRow = {
  id: number;
  url: string;
  tag: string;
  deleted_at: string | null;
};

async function getSites(slug: string): Promise<SiteRow[]> {
  const r = await db.execute({
    sql: `SELECT s.id, s.url, s.tag, s.deleted_at
          FROM sites s
          JOIN companies c ON c.id = s.company_id
          WHERE c.slug = ?
          ORDER BY s.deleted_at IS NULL DESC, s.tag, s.url`,
    args: [slug],
  });
  return r.rows.map((row) => ({
    id: Number(row.id),
    url: String(row.url),
    tag: String(row.tag),
    deleted_at: row.deleted_at === null ? null : String(row.deleted_at),
  }));
}

export default async function SitesPage() {
  const slug = await getAdminCompany();
  const sites = await getSites(slug);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold">Сайты и теги</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Компания: <strong>{slug}</strong>
        </p>
      </div>
      <SitesTable sites={sites} />
    </div>
  );
}
