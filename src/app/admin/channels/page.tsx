import { db } from "@/db/client";
import { getAdminCompany } from "@/lib/admin-company";
import ChannelsTable, { type ChannelRow } from "./ChannelsTable";

async function getChannels(slug: string): Promise<ChannelRow[]> {
  const r = await db.execute({
    sql: `SELECT ch.id, ch.branch, ch.group_name, ch.display_name,
                 ch.utm_source, ch.utm_medium,
                 ch.needs_url_slug, ch.needs_manual_medium, ch.deleted_at
          FROM channels ch
          JOIN companies c ON c.id = ch.company_id
          WHERE c.slug = ?
          ORDER BY ch.deleted_at IS NULL DESC, ch.branch, ch.group_name, ch.display_name`,
    args: [slug],
  });
  return r.rows.map((row) => ({
    id: Number(row.id),
    branch: String(row.branch),
    group_name: row.group_name === null ? null : String(row.group_name),
    display_name: String(row.display_name),
    utm_source: String(row.utm_source),
    utm_medium: row.utm_medium === null ? null : String(row.utm_medium),
    needs_url_slug: Number(row.needs_url_slug) === 1,
    needs_manual_medium: Number(row.needs_manual_medium) === 1,
    deleted_at: row.deleted_at === null ? null : String(row.deleted_at),
  }));
}

export default async function ChannelsPage() {
  const slug = await getAdminCompany();
  const channels = await getChannels(slug);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold">Каналы</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Компания: <strong>{slug}</strong>
        </p>
      </div>
      <ChannelsTable channels={channels} />
    </div>
  );
}
