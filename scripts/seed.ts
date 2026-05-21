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
  default_content?: string | null;
  default_term?: string | null;
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
    sql: `INSERT INTO channels (company_id, branch, group_name, display_name, utm_source, utm_medium, needs_url_slug, needs_manual_medium, default_content, default_term)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      matriusId,
      c.branch,
      c.group_name,
      c.display_name,
      c.utm_source,
      c.utm_medium,
      c.needs_url_slug ?? 0,
      c.needs_manual_medium ?? 0,
      c.default_content ?? null,
      c.default_term ?? null,
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

// =================== ZEROCODER ===================
console.log("\nSeeding Zerocoder data...");

const zerocoderRes = await db.execute({
  sql: `SELECT id FROM companies WHERE slug = ?`,
  args: ["zerocoder"],
});
const zerocoderId = Number(zerocoderRes.rows[0].id);
console.log(`  Zerocoder id = ${zerocoderId}`);

// Очистка Zerocoder перед сидингом
await db.execute({
  sql: `DELETE FROM channels WHERE company_id = ?`,
  args: [zerocoderId],
});

const zerocoderChannels: Channel[] = [
  // ANNOUNCE — 12 каналов
  { branch: "announce", group_name: "email", display_name: "Почта", utm_source: "email", utm_medium: "zerocoder" },
  { branch: "announce", group_name: "telegram", display_name: "ТГ-бот (геткурс)", utm_source: "telegram", utm_medium: "zerocoder-gc" },
  { branch: "announce", group_name: "telegram", display_name: "ТГ-бот (воронки)", utm_source: "telegram", utm_medium: "zerocodity" },
  { branch: "announce", group_name: "telegram", display_name: "Помощник по безопасности", utm_source: "telegram", utm_medium: "antiscam_zero" },
  { branch: "announce", group_name: "telegram", display_name: "Нейрокот", utm_source: "telegram", utm_medium: "neurocat" },
  { branch: "announce", group_name: "telegram", display_name: "ТГ-канал", utm_source: "telegram", utm_medium: "channel_oqode" },
  { branch: "announce", group_name: "telegram", display_name: "Нейросетевые покои", utm_source: "telegram", utm_medium: "pokoi" },
  { branch: "announce", group_name: "telegram", display_name: "Тесты Зерокодер", utm_source: "telegram", utm_medium: "zerocoder_it_test" },
  { branch: "announce", group_name: "max", display_name: "Max", utm_source: "max", utm_medium: "zerocoder" },
  { branch: "announce", group_name: "app", display_name: "Пуш", utm_source: "app", utm_medium: "zerocoder" },
  { branch: "announce", group_name: "instagram", display_name: "Инстаграм", utm_source: "instagram", utm_medium: "zerocoder" },
  { branch: "announce", group_name: "youtube", display_name: "YouTube", utm_source: "yt", utm_medium: null, needs_manual_medium: 1 },

  // ADS — по людям
  { branch: "ads", group_name: "Вика", display_name: "Я.Директ", utm_source: "yandex", utm_medium: "vika" },
  { branch: "ads", group_name: "Вика", display_name: "ТГ-адс", utm_source: "tg_ads", utm_medium: "vika" },
  { branch: "ads", group_name: "Вика", display_name: "Facebook", utm_source: "vika_fb_Mir", utm_medium: "динамичная" },
  { branch: "ads", group_name: "Vlad", display_name: "Google", utm_source: "google", utm_medium: "cpc" },
  { branch: "ads", group_name: "Vlad", display_name: "Facebook", utm_source: "fb", utm_medium: "cpc" },
  { branch: "ads", group_name: "Vlad", display_name: "Instagram", utm_source: "ig", utm_medium: "cpc" },
  { branch: "ads", group_name: "Valeriy", display_name: "VK МП (посевы)", utm_source: "vk_pos", utm_medium: "valeriy" },
  { branch: "ads", group_name: "Valeriy", display_name: "Facebook", utm_source: "fb", utm_medium: "valeriy" },
  { branch: "ads", group_name: "Дмитрий", display_name: "Я.Директ", utm_source: "yandex.direct", utm_medium: "erashovdm" },
  { branch: "ads", group_name: "Александр", display_name: "Я.Директ", utm_source: "yandex", utm_medium: "soldatov" },
  { branch: "ads", group_name: "Александр", display_name: "ТГ (посевы)", utm_source: "tg", utm_medium: "aaa-digital" },
  { branch: "ads", group_name: "Владимир", display_name: "Facebook", utm_source: "fb", utm_medium: "v-koff" },
  { branch: "ads", group_name: "Филипп", display_name: "Facebook", utm_source: "fb", utm_medium: "metapr" },
  { branch: "ads", group_name: "Роман", display_name: "Facebook", utm_source: "fb", utm_medium: "roman01" },

  // GUIDE — 3 канала
  { branch: "guide", group_name: "email", display_name: "Почта", utm_source: "email", utm_medium: "zerocoder" },
  { branch: "guide", group_name: "telegram", display_name: "Телеграм-бот", utm_source: "telegram", utm_medium: "bot_zerocoder" },
  { branch: "guide", group_name: "vk", display_name: "ВК-бот", utm_source: "vk", utm_medium: "zerocoders" },

  // FUNNEL — Воронка вебинара (10 каналов)
  { branch: "funnel", group_name: "Продажное письмо", display_name: "Почта", utm_source: "email", utm_medium: "zerocoder", default_content: "funnel", default_term: "message-N" },
  { branch: "funnel", group_name: "Продажное письмо", display_name: "ТГ-бот", utm_source: "telegram", utm_medium: "bot_zerocoder", default_content: "funnel", default_term: "message-N" },
  { branch: "funnel", group_name: "Вход на вебинар", display_name: "Почта", utm_source: "", utm_medium: "", default_content: "email" },
  { branch: "funnel", group_name: "Вход на вебинар", display_name: "ТГ-бот", utm_source: "", utm_medium: "", default_content: "telegram" },
  { branch: "funnel", group_name: "Вход на вебинар", display_name: "СМС", utm_source: "", utm_medium: "", default_content: "sms" },
  { branch: "funnel", group_name: "Шальной", display_name: "ТГ-бот", utm_source: "", utm_medium: "", default_content: "telegram-baza" },
  { branch: "funnel", group_name: "Шальной", display_name: "ТГ-канал", utm_source: "", utm_medium: "", default_content: "channel_oqode" },
  { branch: "funnel", group_name: "Шальной", display_name: "Нейросетевые покои", utm_source: "", utm_medium: "", default_content: "pokoi" },
  { branch: "funnel", group_name: "Шальной", display_name: "Инстаграм", utm_source: "", utm_medium: "", default_content: "instagram" },
  { branch: "funnel", group_name: "Шальной", display_name: "Нейрокот", utm_source: "", utm_medium: "", default_content: "neurocat-{utm}" },

  // EXTERNAL — Внешние выступления (2 канала)
  { branch: "external", group_name: null, display_name: "Спикерство", utm_source: "pr", utm_medium: "speech", default_content: "спикер" },
  { branch: "external", group_name: null, display_name: "Подкаст", utm_source: "pr", utm_medium: "podcast", default_content: "спикер" },

  // BLOG — Журнал (1 канал)
  { branch: "blog", group_name: null, display_name: "Журнал", utm_source: "magazine", utm_medium: "article", default_content: "url-статья" },

  // GETCOURSE — Геткурс (5 каналов)
  { branch: "getcourse", group_name: null, display_name: "Все тренинги", utm_source: "getcourse", utm_medium: "zerocoder", default_content: null },
  { branch: "getcourse", group_name: null, display_name: "Запись вебинара", utm_source: "site", utm_medium: "getcourse", default_content: "record" },
  { branch: "getcourse", group_name: null, display_name: "Интенсив", utm_source: "site", utm_medium: "getcourse", default_content: "lesson" },
  { branch: "getcourse", group_name: null, display_name: "Урок платного курса", utm_source: "site", utm_medium: "getcourse", default_content: "тег-урока" },
  { branch: "getcourse", group_name: null, display_name: "Баннер", utm_source: "site", utm_medium: "getcourse", default_content: "banner" },
];

for (const c of zerocoderChannels) {
  await db.execute({
    sql: `INSERT INTO channels (company_id, branch, group_name, display_name, utm_source, utm_medium, needs_url_slug, needs_manual_medium, default_content, default_term)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      zerocoderId,
      c.branch,
      c.group_name,
      c.display_name,
      c.utm_source,
      c.utm_medium,
      c.needs_url_slug ?? 0,
      c.needs_manual_medium ?? 0,
      c.default_content ?? null,
      c.default_term ?? null,
    ],
  });
}
console.log(`  ${zerocoderChannels.length} channels loaded`);

// Места размещения Zerocoder: только "guide" (фиксированный content для гайдов)
const zerocoderPlacements = [{ value: "guide", display_name: "Гайд" }];
for (const p of zerocoderPlacements) {
  await db.execute({
    sql: `INSERT OR IGNORE INTO placements (company_id, value, display_name) VALUES (?, ?, ?)`,
    args: [zerocoderId, p.value, p.display_name],
  });
}
console.log(`  ${zerocoderPlacements.length} placement loaded for Zerocoder`);

console.log("\nSeed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
