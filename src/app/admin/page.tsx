import { db } from "@/db/client";
import { getAdminCompany } from "@/lib/admin-company";

async function getStats(slug: string) {
  const r = await db.execute({
    sql: `SELECT
      (SELECT COUNT(*) FROM sites s JOIN companies c ON c.id = s.company_id
        WHERE c.slug = ? AND s.deleted_at IS NULL) AS sites,
      (SELECT COUNT(*) FROM channels ch JOIN companies c ON c.id = ch.company_id
        WHERE c.slug = ? AND ch.deleted_at IS NULL) AS channels,
      (SELECT COUNT(*) FROM placements p JOIN companies c ON c.id = p.company_id
        WHERE c.slug = ? AND p.deleted_at IS NULL) AS placements,
      (SELECT COUNT(*) FROM audit_log) AS log_entries`,
    args: [slug, slug, slug],
  });
  const row = r.rows[0];
  return {
    sites: Number(row.sites),
    channels: Number(row.channels),
    placements: Number(row.placements),
    log: Number(row.log_entries),
  };
}

export default async function AdminHome() {
  const slug = await getAdminCompany();
  const stats = await getStats(slug);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Админка</h1>
      <p className="text-[var(--text-muted)] mb-8">
        Выбрана компания: <strong>{slug}</strong>. Переключи в шапке для работы
        с другой.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Сайтов" value={stats.sites} />
        <Stat label="Каналов" value={stats.channels} />
        <Stat label="Мест размещения" value={stats.placements} />
        <Stat label="Записей в журнале" value={stats.log} />
      </div>

      <section className="border border-[var(--border)] rounded-lg p-4 bg-[var(--surface)]">
        <h2 className="text-lg font-semibold mb-2">Что тут можно</h2>
        <ul className="text-sm text-[var(--text-muted)] space-y-1 list-disc pl-5">
          <li>Редактировать справочники сайтов и тегов</li>
          <li>Управлять каналами по веткам мастера</li>
          <li>Добавлять места размещения для гайдов</li>
          <li>Смотреть историю изменений и откатывать</li>
          <li>Переключаться между компаниями</li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[var(--border)] rounded-lg p-4 bg-[var(--surface)]">
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
