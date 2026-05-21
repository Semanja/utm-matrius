import { db } from "@/db/client";
import HistoryTable from "./HistoryTable";

type HistoryRow = {
  id: number;
  table_name: string;
  record_id: number;
  action: string;
  before_json: string | null;
  after_json: string | null;
  created_at: string;
};

async function getHistory(): Promise<HistoryRow[]> {
  const r = await db.execute({
    sql: `SELECT id, table_name, record_id, action, before_json, after_json, created_at
          FROM audit_log
          ORDER BY id DESC
          LIMIT 200`,
    args: [],
  });
  return r.rows.map((row) => ({
    id: Number(row.id),
    table_name: String(row.table_name),
    record_id: Number(row.record_id),
    action: String(row.action),
    before_json: row.before_json === null ? null : String(row.before_json),
    after_json: row.after_json === null ? null : String(row.after_json),
    created_at: String(row.created_at),
  }));
}

export default async function HistoryPage() {
  const entries = await getHistory();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">История изменений</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Все правки справочников за последние записи. Кнопка «Откатить» —
        восстанавливает состояние до этого изменения.
      </p>
      <HistoryTable entries={entries} />
    </div>
  );
}
