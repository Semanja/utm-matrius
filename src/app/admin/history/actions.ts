"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { isAuthed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

async function requireAuth() {
  if (!(await isAuthed())) throw new Error("Не авторизован");
}

type AuditRow = {
  id: number;
  table_name: string;
  record_id: number;
  action: string;
  before_json: string | null;
  after_json: string | null;
};

const ALLOWED_TABLES = new Set(["sites", "channels", "placements"]);

// Поля, которые восстанавливаем при откате (без company_id — он не меняется)
const RESTORABLE_FIELDS: Record<string, string[]> = {
  sites: ["url", "tag"],
  channels: [
    "branch",
    "group_name",
    "display_name",
    "utm_source",
    "utm_medium",
    "needs_url_slug",
    "needs_manual_medium",
  ],
  placements: ["value", "display_name"],
};

export async function rollback(auditId: number) {
  await requireAuth();

  const r = await db.execute({
    sql: `SELECT id, table_name, record_id, action, before_json, after_json
          FROM audit_log WHERE id = ?`,
    args: [auditId],
  });
  if (r.rows.length === 0) throw new Error("Запись журнала не найдена");

  const row = r.rows[0] as unknown as AuditRow;
  if (!ALLOWED_TABLES.has(row.table_name)) {
    throw new Error(`Откат для таблицы ${row.table_name} не поддерживается`);
  }

  const beforeJson = row.before_json ? JSON.parse(row.before_json) : null;
  const recordId = Number(row.record_id);
  const table = row.table_name;

  if (row.action === "create") {
    // Откат создания = пометить запись удалённой
    const cur = await db.execute({
      sql: `SELECT * FROM ${table} WHERE id = ?`,
      args: [recordId],
    });
    if (cur.rows.length === 0) {
      throw new Error("Запись уже отсутствует");
    }
    await db.execute({
      sql: `UPDATE ${table} SET deleted_at = datetime('now') WHERE id = ?`,
      args: [recordId],
    });
    await logAudit(table, recordId, "delete", cur.rows[0], null);
  } else if (row.action === "delete") {
    // Откат удаления = снять deleted_at
    await db.execute({
      sql: `UPDATE ${table} SET deleted_at = NULL WHERE id = ?`,
      args: [recordId],
    });
    await logAudit(table, recordId, "restore", null, beforeJson);
  } else if (row.action === "update") {
    // Откат правки = восстановить значения из before_json
    if (!beforeJson) throw new Error("Нет before_json — откатить нельзя");
    const fields = RESTORABLE_FIELDS[table];
    if (!fields) throw new Error("Нет известных полей для таблицы");

    const cur = await db.execute({
      sql: `SELECT * FROM ${table} WHERE id = ?`,
      args: [recordId],
    });
    if (cur.rows.length === 0) throw new Error("Запись не найдена");

    const setParts: string[] = [];
    const args: (string | number | null)[] = [];
    for (const f of fields) {
      if (f in beforeJson) {
        setParts.push(`${f} = ?`);
        args.push(beforeJson[f] as string | number | null);
      }
    }
    args.push(recordId);

    await db.execute({
      sql: `UPDATE ${table} SET ${setParts.join(", ")} WHERE id = ?`,
      args,
    });
    await logAudit(table, recordId, "update", cur.rows[0], beforeJson);
  } else if (row.action === "restore") {
    // Откат восстановления = снова удалить
    const cur = await db.execute({
      sql: `SELECT * FROM ${table} WHERE id = ?`,
      args: [recordId],
    });
    if (cur.rows.length === 0) throw new Error("Запись не найдена");
    await db.execute({
      sql: `UPDATE ${table} SET deleted_at = datetime('now') WHERE id = ?`,
      args: [recordId],
    });
    await logAudit(table, recordId, "delete", cur.rows[0], null);
  } else {
    throw new Error(`Неизвестное действие: ${row.action}`);
  }

  revalidatePath("/admin/history");
  revalidatePath(`/admin/${table}`);
}
