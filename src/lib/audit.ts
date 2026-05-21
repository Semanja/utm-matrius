import { db } from "@/db/client";

type Action = "create" | "update" | "delete" | "restore";

export async function logAudit(
  tableName: string,
  recordId: number,
  action: Action,
  before: unknown,
  after: unknown
) {
  await db.execute({
    sql: `INSERT INTO audit_log (table_name, record_id, action, before_json, after_json)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      tableName,
      recordId,
      action,
      before === null || before === undefined ? null : JSON.stringify(before),
      after === null || after === undefined ? null : JSON.stringify(after),
    ],
  });
}
