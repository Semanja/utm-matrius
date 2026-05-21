import { db } from "./client";

export type Company = {
  id: number;
  slug: string;
  name: string;
  configured: boolean;
};

export type Site = {
  id: number;
  url: string;
  tag: string;
};

export type Channel = {
  id: number;
  branch: string;
  group_name: string | null;
  display_name: string;
  utm_source: string;
  utm_medium: string | null;
  needs_url_slug: boolean;
  needs_manual_medium: boolean;
};

export type Placement = {
  id: number;
  value: string;
  display_name: string | null;
};

export type CompanyData = {
  channels: Channel[];
  sites: Site[];
  placements: Placement[];
};

export async function getCompanies(): Promise<Company[]> {
  const res = await db.execute({
    sql: `SELECT c.id, c.slug, c.name,
                 (SELECT COUNT(*) FROM channels
                  WHERE company_id = c.id AND deleted_at IS NULL) AS channel_count
          FROM companies c
          ORDER BY c.id`,
    args: [],
  });

  return res.rows.map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    configured: Number(r.channel_count) > 0,
  }));
}

export async function getSitesByCompanySlug(slug: string): Promise<Site[]> {
  const res = await db.execute({
    sql: `SELECT s.id, s.url, s.tag
          FROM sites s
          JOIN companies c ON c.id = s.company_id
          WHERE c.slug = ? AND s.deleted_at IS NULL
          ORDER BY s.tag, s.url`,
    args: [slug],
  });

  return res.rows.map((r) => ({
    id: Number(r.id),
    url: String(r.url),
    tag: String(r.tag),
  }));
}

export async function getCompanyData(slug: string): Promise<CompanyData> {
  const companyRes = await db.execute({
    sql: `SELECT id FROM companies WHERE slug = ?`,
    args: [slug],
  });
  if (companyRes.rows.length === 0) {
    return { channels: [], sites: [], placements: [] };
  }
  const companyId = Number(companyRes.rows[0].id);

  const channelsRes = await db.execute({
    sql: `SELECT id, branch, group_name, display_name, utm_source, utm_medium,
                 needs_url_slug, needs_manual_medium
          FROM channels
          WHERE company_id = ? AND deleted_at IS NULL
          ORDER BY branch, group_name, display_name`,
    args: [companyId],
  });

  const sitesRes = await db.execute({
    sql: `SELECT id, url, tag
          FROM sites
          WHERE company_id = ? AND deleted_at IS NULL
          ORDER BY tag, url`,
    args: [companyId],
  });

  const placementsRes = await db.execute({
    sql: `SELECT id, value, display_name
          FROM placements
          WHERE company_id = ? AND deleted_at IS NULL
          ORDER BY id`,
    args: [companyId],
  });

  return {
    channels: channelsRes.rows.map((r) => ({
      id: Number(r.id),
      branch: String(r.branch),
      group_name: r.group_name === null ? null : String(r.group_name),
      display_name: String(r.display_name),
      utm_source: String(r.utm_source),
      utm_medium: r.utm_medium === null ? null : String(r.utm_medium),
      needs_url_slug: Number(r.needs_url_slug) === 1,
      needs_manual_medium: Number(r.needs_manual_medium) === 1,
    })),
    sites: sitesRes.rows.map((r) => ({
      id: Number(r.id),
      url: String(r.url),
      tag: String(r.tag),
    })),
    placements: placementsRes.rows.map((r) => ({
      id: Number(r.id),
      value: String(r.value),
      display_name: r.display_name === null ? null : String(r.display_name),
    })),
  };
}
