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

export async function createPlacement(formData: FormData) {
  await requireAuth();
  const value = String(formData.get("value") || "").trim();
  const display_name = String(formData.get("display_name") || "").trim() || null;
  if (!value) throw new Error("Значение обязательно");

  const companyId = await getCompanyId(await getAdminCompany());

  const res = await db.execute({
    sql: `INSERT INTO placements (company_id, value, display_name) VALUES (?, ?, ?)`,
    args: [companyId, value, display_name],
  });

  await logAudit("placements", Number(res.lastInsertRowid), "create", null, {
    value,
    display_name,
    company_id: companyId,
  });
  revalidatePath("/admin/placements");
}

export async function updatePlacement(id: number, formData: FormData) {
  await requireAuth();
  const value = String(formData.get("value") || "").trim();
  const display_name = String(formData.get("display_name") || "").trim() || null;
  if (!value) throw new Error("Значение обязательно");

  const before = await db.execute({
    sql: `SELECT value, display_name FROM placements WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) throw new Error("Запись не найдена");

  await db.execute({
    sql: `UPDATE placements SET value = ?, display_name = ? WHERE id = ?`,
    args: [value, display_name, id],
  });

  await logAudit("placements", id, "update", before.rows[0], {
    value,
    display_name,
  });
  revalidatePath("/admin/placements");
}

export async function deletePlacement(id: number) {
  await requireAuth();

  const before = await db.execute({
    sql: `SELECT value, display_name FROM placements WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) return;

  await db.execute({
    sql: `UPDATE placements SET deleted_at = datetime('now') WHERE id = ?`,
    args: [id],
  });
  await logAudit("placements", id, "delete", before.rows[0], null);
  revalidatePath("/admin/placements");
}

export async function restorePlacement(id: number) {
  await requireAuth();
  const before = await db.execute({
    sql: `SELECT value FROM placements WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) return;
  await db.execute({
    sql: `UPDATE placements SET deleted_at = NULL WHERE id = ?`,
    args: [id],
  });
  await logAudit("placements", id, "restore", null, before.rows[0]);
  revalidatePath("/admin/placements");
}
