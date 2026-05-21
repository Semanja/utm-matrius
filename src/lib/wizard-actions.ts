"use server";

import { db } from "@/db/client";
import { logAudit } from "@/lib/audit";
import { extractUrlSlug } from "@/lib/utm";

/**
 * Сохраняет сайт в справочник компании из мастера (без требования admin auth).
 * - Если такой URL уже есть и активен с тем же тегом — ничего не делает.
 * - Если есть с другим тегом — обновляет тег.
 * - Если есть, но удалён — восстанавливает и обновляет тег.
 * - Иначе создаёт новую запись.
 *
 * Если tag не передан или пустой — берём slug из URL.
 */
export async function saveSiteFromWizard(
  url: string,
  tag: string,
  companySlug: string
): Promise<{ saved: boolean; reason?: string }> {
  const cleanUrl = (url || "").trim();
  const cleanTag = (tag || "").trim() || extractUrlSlug(cleanUrl);

  if (!cleanUrl) return { saved: false, reason: "URL обязателен" };
  if (!cleanTag) return { saved: false, reason: "Не удалось определить тег" };

  const companyRes = await db.execute({
    sql: `SELECT id FROM companies WHERE slug = ?`,
    args: [companySlug],
  });
  if (companyRes.rows.length === 0) {
    return { saved: false, reason: `Компания ${companySlug} не найдена` };
  }
  const companyId = Number(companyRes.rows[0].id);

  const existing = await db.execute({
    sql: `SELECT id, tag, deleted_at FROM sites WHERE company_id = ? AND url = ?`,
    args: [companyId, cleanUrl],
  });

  if (existing.rows.length > 0) {
    const id = Number(existing.rows[0].id);
    const oldTag = String(existing.rows[0].tag);
    const isDeleted = existing.rows[0].deleted_at !== null;

    if (oldTag === cleanTag && !isDeleted) {
      return { saved: true, reason: "Уже был в справочнике" };
    }

    await db.execute({
      sql: `UPDATE sites SET tag = ?, deleted_at = NULL WHERE id = ?`,
      args: [cleanTag, id],
    });
    await logAudit(
      "sites",
      id,
      "update",
      { url: cleanUrl, tag: oldTag, deleted: isDeleted },
      { url: cleanUrl, tag: cleanTag, via: "wizard" }
    );
    return { saved: true };
  }

  const ins = await db.execute({
    sql: `INSERT INTO sites (company_id, url, tag) VALUES (?, ?, ?)`,
    args: [companyId, cleanUrl, cleanTag],
  });
  await logAudit(
    "sites",
    Number(ins.lastInsertRowid),
    "create",
    null,
    { url: cleanUrl, tag: cleanTag, company_id: companyId, via: "wizard" }
  );
  return { saved: true };
}
