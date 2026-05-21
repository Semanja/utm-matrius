import { db } from "@/db/client";
import { getAdminCompany } from "@/lib/admin-company";
import PlacementsTable, { type PlacementRow } from "./PlacementsTable";

async function getPlacements(slug: string): Promise<PlacementRow[]> {
  const r = await db.execute({
    sql: `SELECT p.id, p.value, p.display_name, p.deleted_at
          FROM placements p
          JOIN companies c ON c.id = p.company_id
          WHERE c.slug = ?
          ORDER BY p.deleted_at IS NULL DESC, p.id`,
    args: [slug],
  });
  return r.rows.map((row) => ({
    id: Number(row.id),
    value: String(row.value),
    display_name: row.display_name === null ? null : String(row.display_name),
    deleted_at: row.deleted_at === null ? null : String(row.deleted_at),
  }));
}

export default async function PlacementsPage() {
  const slug = await getAdminCompany();
  const placements = await getPlacements(slug);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-2xl font-bold">Места размещения (Гайд)</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Компания: <strong>{slug}</strong>
        </p>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Значения пойдут в <code>utm_content</code> для ветки Гайд.
      </p>
      <PlacementsTable placements={placements} />
    </div>
  );
}
