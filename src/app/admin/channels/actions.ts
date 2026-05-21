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

type ChannelInput = {
  branch: string;
  group_name: string | null;
  display_name: string;
  utm_source: string;
  utm_medium: string | null;
  needs_url_slug: number;
  needs_manual_medium: number;
};

function parseForm(formData: FormData): ChannelInput {
  const branch = String(formData.get("branch") || "").trim();
  const group_name = String(formData.get("group_name") || "").trim() || null;
  const display_name = String(formData.get("display_name") || "").trim();
  const utm_source = String(formData.get("utm_source") || "").trim();
  const utm_medium = String(formData.get("utm_medium") || "").trim() || null;
  const needs_url_slug = formData.get("needs_url_slug") ? 1 : 0;
  const needs_manual_medium = formData.get("needs_manual_medium") ? 1 : 0;

  if (!branch) throw new Error("Ветка обязательна");
  if (!display_name) throw new Error("Название канала обязательно");
  if (!utm_source) throw new Error("utm_source обязателен");

  return {
    branch,
    group_name,
    display_name,
    utm_source,
    utm_medium,
    needs_url_slug,
    needs_manual_medium,
  };
}

export async function createChannel(formData: FormData) {
  await requireAuth();
  const data = parseForm(formData);
  const companyId = await getCompanyId(await getAdminCompany());

  const res = await db.execute({
    sql: `INSERT INTO channels (company_id, branch, group_name, display_name,
            utm_source, utm_medium, needs_url_slug, needs_manual_medium)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      companyId,
      data.branch,
      data.group_name,
      data.display_name,
      data.utm_source,
      data.utm_medium,
      data.needs_url_slug,
      data.needs_manual_medium,
    ],
  });

  await logAudit("channels", Number(res.lastInsertRowid), "create", null, {
    ...data,
    company_id: companyId,
  });
  revalidatePath("/admin/channels");
}

export async function updateChannel(id: number, formData: FormData) {
  await requireAuth();
  const data = parseForm(formData);

  const before = await db.execute({
    sql: `SELECT branch, group_name, display_name, utm_source, utm_medium,
                 needs_url_slug, needs_manual_medium FROM channels WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) throw new Error("Запись не найдена");

  await db.execute({
    sql: `UPDATE channels SET branch=?, group_name=?, display_name=?,
            utm_source=?, utm_medium=?, needs_url_slug=?, needs_manual_medium=?
          WHERE id = ?`,
    args: [
      data.branch,
      data.group_name,
      data.display_name,
      data.utm_source,
      data.utm_medium,
      data.needs_url_slug,
      data.needs_manual_medium,
      id,
    ],
  });

  await logAudit("channels", id, "update", before.rows[0], data);
  revalidatePath("/admin/channels");
}

export async function deleteChannel(id: number) {
  await requireAuth();
  const before = await db.execute({
    sql: `SELECT display_name, branch FROM channels WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) return;

  await db.execute({
    sql: `UPDATE channels SET deleted_at = datetime('now') WHERE id = ?`,
    args: [id],
  });
  await logAudit("channels", id, "delete", before.rows[0], null);
  revalidatePath("/admin/channels");
}

export async function restoreChannel(id: number) {
  await requireAuth();
  const before = await db.execute({
    sql: `SELECT display_name FROM channels WHERE id = ?`,
    args: [id],
  });
  if (before.rows.length === 0) return;

  await db.execute({
    sql: `UPDATE channels SET deleted_at = NULL WHERE id = ?`,
    args: [id],
  });
  await logAudit("channels", id, "restore", null, before.rows[0]);
  revalidatePath("/admin/channels");
}
