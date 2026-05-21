import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set in .env.local");
}

async function main() {
const db = createClient({ url: url!, authToken });

// 1. Компании
console.log("Seeding companies...");
await db.execute({
  sql: `INSERT OR IGNORE INTO companies (slug, name) VALUES (?, ?), (?, ?)`,
  args: ["matrius", "Matrius", "zerocoder", "Zerocoder"],
});

const matriusRes = await db.execute({
  sql: `SELECT id FROM companies WHERE slug = ?`,
  args: ["matrius"],
});
const matriusId = Number(matriusRes.rows[0].id);
console.log(`  Matrius id = ${matriusId}`);

// 2. Сайты (из data/site-tags.json)
console.log("Seeding sites...");
const siteTagsPath = join(process.cwd(), "data", "site-tags.json");
const siteTags = JSON.parse(readFileSync(siteTagsPath, "utf-8")) as {
  entries: { url: string; tag: string }[];
};

for (const entry of siteTags.entries) {
  await db.execute({
    sql: `INSERT OR IGNORE INTO sites (company_id, url, tag) VALUES (?, ?, ?)`,
    args: [matriusId, entry.url, entry.tag],
  });
}
console.log(`  ${siteTags.entries.length} sites loaded`);

// 3. Каналы
console.log("Seeding channels...");

type Channel = {
  branch: string;
  group_name: string | null;
  display_name: string;
  utm_source: string;
  utm_medium: string | null;
  needs_url_slug?: number;
  needs_manual_medium?: number;
};

const channels: Channel[] = [
  // ANNOUNCE
  { branch: "announce", group_name: "email", display_name: "Unisender", utm_source: "email", utm_medium: "unisender" },
  { branch: "announce", group_name: "email", display_name: "Геткурс", utm_source: "email", utm_medium: "getcourse" },
  { branch: "announce", group_name: "tg-bot", display_name: "Матриус", utm_source: "tg-bot", utm_medium: "schoolmatrius_bot" },
  { branch: "announce", group_name: "tg-bot", display_name: "Геткурс", utm_source: "tg-bot", utm_medium: "school_matrius_bot" },
  { branch: "announce", group_name: "vk-bot", display_name: "Матриус", utm_source: "vk-bot", utm_medium: "matrius_ru" },
  { branch: "announce", group_name: "max-bot", display_name: "Матриус", utm_source: "max-bot", utm_medium: "id1840120295_bot" },
  { branch: "announce", group_name: "max-bot", display_name: "Геткурс", utm_source: "max-bot", utm_medium: "id1840120295_5_bot" },

  // SMM
  { branch: "smm", group_name: null, display_name: "ВК-пост", utm_source: "vk", utm_medium: "matrius_ru" },
  { branch: "smm", group_name: null, display_name: "Телеграм-пост", utm_source: "telegram", utm_medium: "matrius_ru" },
  { branch: "smm", group_name: null, display_name: "Max-пост", utm_source: "max", utm_medium: "@id1840120295_biz" },

  // ADS — персональные
  { branch: "ads", group_name: "Артём", display_name: "Я.Директ", utm_source: "yandex", utm_medium: "artem" },
  { branch: "ads", group_name: "Артём", display_name: "VK-лидформа", utm_source: "vk-leadform-artem", utm_medium: "artem" },
  { branch: "ads", group_name: "Артём", display_name: "VK-ads", utm_source: "vk-ads", utm_medium: "artem" },
  { branch: "ads", group_name: "Максим", display_name: "VK-лидформа", utm_source: "vk-leadform-max", utm_medium: "max" },
  { branch: "ads", group_name: "Света", display_name: "VK-лидформа", utm_source: "vk-leadform-svet", utm_medium: "svet" },
  { branch: "ads", group_name: "Илья", display_name: "Я.Директ", utm_source: "yandex", utm_medium: "ilya_", needs_url_slug: 1 },
  { branch: "ads", group_name: "Евгения", display_name: "VK-лидформа", utm_source: "vk-leadform-evgenia", utm_medium: "evgenia" },
  { branch: "ads", group_name: "Евгения", display_name: "VK-ads", utm_source: "vk-ads", utm_medium: "evgenia_", needs_url_slug: 1 },
  { branch: "ads", group_name: "Ирина", display_name: "VK-ads", utm_source: "vk-ads", utm_medium: "irina_", needs_url_slug: 1 },

  // ADS — «Другое»
  { branch: "ads", group_name: "other", display_name: "RIS", utm_source: "ris", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "RIS IT", utm_source: "ris-it", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "Flocktory", utm_source: "flocktory", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "Centrium", utm_source: "centrium", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "Primelead (автообзвон)", utm_source: "Primelead", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "Avito", utm_source: "avito", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "Автообзвон — наша база", utm_source: "autocall_baza", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "Автообзвон — перфоманс", utm_source: "autocall_dop", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "Педагоги РФ", utm_source: "pedagogirf-12.25", utm_medium: null, needs_manual_medium: 1 },
  { branch: "ads", group_name: "other", display_name: "Special", utm_source: "special", utm_medium: null, needs_manual_medium: 1 },
];

// Очищаем старые каналы для Matrius перед сидингом (чтобы повторный seed не дублировал)
await db.execute({
  sql: `DELETE FROM channels WHERE company_id = ?`,
  args: [matriusId],
});

for (const c of channels) {
  await db.execute({
    sql: `INSERT INTO channels (company_id, branch, group_name, display_name, utm_source, utm_medium, needs_url_slug, needs_manual_medium)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      matriusId,
      c.branch,
      c.group_name,
      c.display_name,
      c.utm_source,
      c.utm_medium,
      c.needs_url_slug ?? 0,
      c.needs_manual_medium ?? 0,
    ],
  });
}
console.log(`  ${channels.length} channels loaded`);

// 4. Места размещения для гайда
console.log("Seeding placements...");
const placements = [
  { value: "link-text", display_name: "Текстовая ссылка" },
  { value: "qr", display_name: "QR-код" },
  { value: "image", display_name: "Картинка" },
  { value: "button", display_name: "Кнопка" },
];

for (const p of placements) {
  await db.execute({
    sql: `INSERT OR IGNORE INTO placements (company_id, value, display_name) VALUES (?, ?, ?)`,
    args: [matriusId, p.value, p.display_name],
  });
}
console.log(`  ${placements.length} placements loaded`);

console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
