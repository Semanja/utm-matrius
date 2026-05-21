"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { isAuthed } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getAdminCompany } from "@/lib/admin-company";

async function requireAuth() {
  if (!(await isAuthed())) throw new Error("Не авторизован");
}

async function getCompanyId(slug: string): Promise<number> {
  const r = await db.execute({
    sql: `SELECT id FROM companies WHERE slug = ?`,
    args: [slug],
  });
  if (r.rows.length === 0) throw new Error(`Компания ${slug} не найдена`);
  return Number(r.rows[0].id);
}

export async function createSite(formData: FormData) {
  await requireAuth();
  const url = String(formData.get("url") || "").trim();
  const tag = String(formData.get("tag") || "").trim();
  if (!url) throw new Error("URL обязателен");
  if (!tag) throw new Error("Тег обязателен");

  const slug = await getAdminCompany();
  const companyId = await getCompanyId(slug);

  const res = await db.execute({
    sql: `INSERT INTO sites (company_id, url, tag) VALUES (?, ?, ?)`,
    args: [companyId, url, tag],
  });

  const newId = Number(res.lastInsertRowid);
  await logAudit("sites", newId, "create", null, { url, tag, company_id: companyId });
  revalidatePath("/admin/sites");
}

export async function updateSite(id: number, formData: FormData) {
  await requireAuth();
  const url = String(formData.get("url") || "").trim();
  const tag = String(formData.get("tag") || "").trim();
  if (!url) throw new Error("URL обязателен");
  if (!tag) throw new Error("Тег обязателен");

  const before = await db.execute({
    sql: `SELECT url, tag FROM sites WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) throw new Error("Запись не найдена");

  await db.execute({
    sql: `UPDATE sites SET url = ?, tag = ? WHERE id = ?`,
    args: [url, tag, id],
  });

  await logAudit(
    "sites",
    id,
    "update",
    { url: before.rows[0].url, tag: before.rows[0].tag },
    { url, tag }
  );
  revalidatePath("/admin/sites");
}

export async function deleteSite(id: number) {
  await requireAuth();

  const before = await db.execute({
    sql: `SELECT url, tag FROM sites WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) return;

  await db.execute({
    sql: `UPDATE sites SET deleted_at = datetime('now') WHERE id = ?`,
    args: [id],
  });

  await logAudit(
    "sites",
    id,
    "delete",
    { url: before.rows[0].url, tag: before.rows[0].tag },
    null
  );
  revalidatePath("/admin/sites");
}

export type BulkRow = { url: string; tag: string };
export type BulkResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export async function bulkImportSites(
  rows: BulkRow[],
  mode: "skip" | "overwrite"
): Promise<BulkResult> {
  await requireAuth();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Пустой список");
  }

  const slug = await getAdminCompany();
  const companyId = await getCompanyId(slug);

  const result: BulkResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    const url = String(row.url || "").trim();
    const tag = String(row.tag || "").trim();
    if (!url || !tag) {
      result.skipped++;
      result.errors.push(`Пропущена строка с пустым полем: ${JSON.stringify(row)}`);
      continue;
    }

    try {
      // Ищем существующую запись (включая удалённые — чтобы восстанавливать)
      const existing = await db.execute({
        sql: `SELECT id, tag, deleted_at FROM sites WHERE company_id = ? AND url = ?`,
        args: [companyId, url],
      });

      if (existing.rows.length > 0) {
        const existingId = Number(existing.rows[0].id);
        const existingTag = String(existing.rows[0].tag);
        const isDeleted = existing.rows[0].deleted_at !== null;

        if (existingTag === tag && !isDeleted) {
          // Уже точно такая же запись — пропускаем тихо
          result.skipped++;
          continue;
        }

        if (mode === "skip") {
          result.skipped++;
          continue;
        }

        // Overwrite: обновляем тег + восстанавливаем если удалённая
        await db.execute({
          sql: `UPDATE sites SET tag = ?, deleted_at = NULL WHERE id = ?`,
          args: [tag, existingId],
        });
        await logAudit(
          "sites",
          existingId,
          "update",
          { url, tag: existingTag, deleted: isDeleted },
          { url, tag }
        );
        result.updated++;
      } else {
        const ins = await db.execute({
          sql: `INSERT INTO sites (company_id, url, tag) VALUES (?, ?, ?)`,
          args: [companyId, url, tag],
        });
        await logAudit(
          "sites",
          Number(ins.lastInsertRowid),
          "create",
          null,
          { url, tag, company_id: companyId }
        );
        result.created++;
      }
    } catch (e) {
      result.errors.push(
        `${url}: ${e instanceof Error ? e.message : "ошибка"}`
      );
    }
  }

  revalidatePath("/admin/sites");
  return result;
}

export async function restoreSite(id: number) {
  await requireAuth();

  const before = await db.execute({
    sql: `SELECT url, tag FROM sites WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) return;

  await db.execute({
    sql: `UPDATE sites SET deleted_at = NULL WHERE id = ?`,
    args: [id],
  });

  await logAudit(
    "sites",
    id,
    "restore",
    null,
    { url: before.rows[0].url, tag: before.rows[0].tag }
  );
  revalidatePath("/admin/sites");
}
