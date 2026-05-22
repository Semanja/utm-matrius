// Полная проверка UTM-генерации по ТЗ.
// Запуск: npm run verify

import { buildUtm, extractUrlSlug } from "../src/lib/utm";

type Scenario = {
  name: string;
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  expected_url: string;
};

const scenarios: Scenario[] = [
  // ====================================
  //              MATRIUS
  // ====================================
  {
    name: "Matrius Анонс / Email Unisender → campaign = URL slug, term с date_",
    baseUrl: "https://matrius.online/freemaths",
    source: "email",
    medium: "unisender",
    campaign: extractUrlSlug("https://matrius.online/freemaths"),
    content: "announce",
    term: "date_20.05.26",
    expected_url:
      "https://matrius.online/freemaths?utm_source=email&utm_medium=unisender&utm_campaign=freemaths&utm_content=announce&utm_term=date_20.05.26",
  },
  {
    name: "Matrius Анонс / Email Геткурс",
    baseUrl: "https://matrius.online/matematika",
    source: "email",
    medium: "getcourse",
    campaign: "matematika",
    content: "announce",
    term: "date_20.05.26",
    expected_url:
      "https://matrius.online/matematika?utm_source=email&utm_medium=getcourse&utm_campaign=matematika&utm_content=announce&utm_term=date_20.05.26",
  },
  {
    name: "Matrius Анонс / Max-бот геткурс",
    baseUrl: "https://matrius.online/lesson30min",
    source: "max-bot",
    medium: "id1840120295_5_bot",
    campaign: "lesson30min",
    content: "announce",
    term: "date_20.05.26",
    expected_url:
      "https://matrius.online/lesson30min?utm_source=max-bot&utm_medium=id1840120295_5_bot&utm_campaign=lesson30min&utm_content=announce&utm_term=date_20.05.26",
  },
  {
    name: "Matrius СММ / ВК-пост → content=post",
    baseUrl: "https://matrius.online/lesson30min",
    source: "vk",
    medium: "matrius_ru",
    campaign: "lesson30min",
    content: "post",
    term: "date_20.05.26",
    expected_url:
      "https://matrius.online/lesson30min?utm_source=vk&utm_medium=matrius_ru&utm_campaign=lesson30min&utm_content=post&utm_term=date_20.05.26",
  },
  {
    name: "Matrius СММ / Max-пост → @id1840120295_biz",
    baseUrl: "https://matrius.online/freemaths",
    source: "max",
    medium: "@id1840120295_biz",
    campaign: "freemaths",
    content: "post",
    term: "date_20.05.26",
    expected_url:
      "https://matrius.online/freemaths?utm_source=max&utm_medium=%40id1840120295_biz&utm_campaign=freemaths&utm_content=post&utm_term=date_20.05.26",
  },
  {
    name: "Matrius Гайд / Скорочтение → site.tag, content=qr, term=mm.yy",
    baseUrl: "https://matrius.online/triallessonspeedreading",
    source: "pdf",
    medium: "skorochtenie",
    campaign: "show-sr-flow-1",
    content: "qr",
    term: "05.26",
    expected_url:
      "https://matrius.online/triallessonspeedreading?utm_source=pdf&utm_medium=skorochtenie&utm_campaign=show-sr-flow-1&utm_content=qr&utm_term=05.26",
  },
  {
    name: "Matrius Реклама / Артём Я.Директ (URL slug → campaign, спец-кейс)",
    baseUrl: "https://matrius.online/lesson30min",
    source: "yandex",
    medium: "artem",
    campaign: "lesson30min", // URL slug, не site.tag
    content: "",
    term: "",
    expected_url:
      "https://matrius.online/lesson30min?utm_source=yandex&utm_medium=artem&utm_campaign=lesson30min",
  },
  {
    name: "Matrius Реклама / Илья Я.Директ (хвост в medium)",
    baseUrl: "https://matrius.online/lesson30min",
    source: "yandex",
    medium: "ilya_lesson30min",
    campaign: "lesson-flow-1",
    content: "",
    term: "",
    expected_url:
      "https://matrius.online/lesson30min?utm_source=yandex&utm_medium=ilya_lesson30min&utm_campaign=lesson-flow-1",
  },
  {
    name: "Matrius Реклама / Евгения VK-ads (хвост в medium)",
    baseUrl: "https://matrius.online/freemaths",
    source: "vk-ads",
    medium: "evgenia_freemaths",
    campaign: "show-math-flow-1",
    content: "",
    term: "",
    expected_url:
      "https://matrius.online/freemaths?utm_source=vk-ads&utm_medium=evgenia_freemaths&utm_campaign=show-math-flow-1",
  },
  {
    name: "Matrius Реклама / Максим VK-лидформа (1 канал, автомат)",
    baseUrl: "https://matrius.online/lesson30min",
    source: "vk-leadform-max",
    medium: "max",
    campaign: "lesson-flow-1",
    content: "",
    term: "",
    expected_url:
      "https://matrius.online/lesson30min?utm_source=vk-leadform-max&utm_medium=max&utm_campaign=lesson-flow-1",
  },
  {
    name: "Matrius Реклама / Другое (Avito, manual medium)",
    baseUrl: "https://matrius.online/freemaths",
    source: "avito",
    medium: "msk-promo",
    campaign: "show-math-flow-1",
    content: "",
    term: "",
    expected_url:
      "https://matrius.online/freemaths?utm_source=avito&utm_medium=msk-promo&utm_campaign=show-math-flow-1",
  },

  // ====================================
  //              ZEROCODER
  // ====================================
  {
    name: "Zerocoder Анонс / Telegram zerocoder (общая) — реальный пример из рассылки",
    baseUrl: "https://university.zerocoder.ru/demo-neuro-kids_order_mail",
    source: "telegram",
    medium: "zerocoder",
    campaign: "neuroteen", // site.tag (не URL slug)
    content: "announce",
    term: "17.05.26", // без date_ префикса
    expected_url:
      "https://university.zerocoder.ru/demo-neuro-kids_order_mail?utm_source=telegram&utm_medium=zerocoder&utm_campaign=neuroteen&utm_content=announce&utm_term=17.05.26",
  },
  {
    name: "Zerocoder Анонс / ТГ-бот геткурс / реальный пример (announce-women)",
    baseUrl:
      "https://zerocoder.ru/practical-lecture-for-parents-of-schoolchildren-aged-8-15-r",
    source: "telegram",
    medium: "zerocoder-gc",
    campaign: "zero-neuro-kids-6-repeat0526",
    content: "announce-women",
    term: "06.05.26",
    expected_url:
      "https://zerocoder.ru/practical-lecture-for-parents-of-schoolchildren-aged-8-15-r?utm_source=telegram&utm_medium=zerocoder-gc&utm_campaign=zero-neuro-kids-6-repeat0526&utm_content=announce-women&utm_term=06.05.26",
  },
  {
    name: "Zerocoder Анонс / Max → utm_source=max, utm_medium=zerocoder",
    baseUrl: "https://zerocoder.ru/event",
    source: "max",
    medium: "zerocoder",
    campaign: "event-tag",
    content: "announce",
    term: "20.05.26",
    expected_url:
      "https://zerocoder.ru/event?utm_source=max&utm_medium=zerocoder&utm_campaign=event-tag&utm_content=announce&utm_term=20.05.26",
  },
  {
    name: "Zerocoder Воронка / Продажное письмо ТГ-бот → content=funnel, term=message-N",
    baseUrl: "https://zerocoder.ru/webinar",
    source: "telegram",
    medium: "bot_zerocoder",
    campaign: "webinar",
    content: "funnel",
    term: "message-N",
    expected_url:
      "https://zerocoder.ru/webinar?utm_source=telegram&utm_medium=bot_zerocoder&utm_campaign=webinar&utm_content=funnel&utm_term=message-N",
  },
  {
    name: "Zerocoder Воронка / Вход на вебинар СМС (только content)",
    baseUrl: "https://zerocoder.ru/webinar",
    source: "",
    medium: "",
    campaign: "webinar",
    content: "sms",
    term: "",
    expected_url:
      "https://zerocoder.ru/webinar?utm_campaign=webinar&utm_content=sms",
  },
  {
    name: "Zerocoder Воронка / Шальной — Нейрокот",
    baseUrl: "https://zerocoder.ru/promo",
    source: "",
    medium: "",
    campaign: "promo",
    content: "neurocat-{utm}",
    term: "",
    expected_url:
      "https://zerocoder.ru/promo?utm_campaign=promo&utm_content=neurocat-{utm}",
  },
  {
    name: "Zerocoder Внешние / Спикерство (категория партнёр, имя в content)",
    baseUrl: "https://zerocoder.ru/partner-event",
    source: "pr",
    medium: "speech",
    campaign: "Иван Иванов",
    content: "Иван Иванов",
    term: "10.05.26",
    expected_url:
      "https://zerocoder.ru/partner-event?utm_source=pr&utm_medium=speech&utm_campaign=%D0%98%D0%B2%D0%B0%D0%BD%20%D0%98%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2&utm_content=%D0%98%D0%B2%D0%B0%D0%BD%20%D0%98%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2&utm_term=10.05.26",
  },
  {
    name: "Zerocoder Внешние / Подкаст",
    baseUrl: "https://zerocoder.ru/podcast",
    source: "pr",
    medium: "podcast",
    campaign: "ai-podcast-march",
    content: "Анна Петрова",
    term: "15.05.26",
    expected_url:
      "https://zerocoder.ru/podcast?utm_source=pr&utm_medium=podcast&utm_campaign=ai-podcast-march&utm_content=%D0%90%D0%BD%D0%BD%D0%B0%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2%D0%B0&utm_term=15.05.26",
  },
  {
    name: "Zerocoder Блог / Статья (content = URL статьи)",
    baseUrl: "https://zerocoder.ru/landing",
    source: "magazine",
    medium: "article",
    campaign: "neuroteen",
    content: "https://habr.com/article-on-zero",
    term: "10.05.26",
    expected_url:
      "https://zerocoder.ru/landing?utm_source=magazine&utm_medium=article&utm_campaign=neuroteen&utm_content=https%3A%2F%2Fhabr.com%2Farticle-on-zero&utm_term=10.05.26",
  },
  {
    name: "Zerocoder Блог / Баннер",
    baseUrl: "https://zerocoder.ru/landing",
    source: "magazine",
    medium: "banner",
    campaign: "promo-tag",
    content: "https://site.com/page",
    term: "10.05.26",
    expected_url:
      "https://zerocoder.ru/landing?utm_source=magazine&utm_medium=banner&utm_campaign=promo-tag&utm_content=https%3A%2F%2Fsite.com%2Fpage&utm_term=10.05.26",
  },
  {
    name: "Zerocoder Реклама / Вика Я.Директ кабинет 2 (плейсхолдеры Яндекса)",
    baseUrl: "https://zerocoder.ru/landing",
    source: "Yandex_vika_kab2",
    medium: "cpc",
    campaign: "{campaign_id}",
    content: "{ad_id}",
    term: "{keyword}",
    expected_url:
      "https://zerocoder.ru/landing?utm_source=Yandex_vika_kab2&utm_medium=cpc&utm_campaign={campaign_id}&utm_content={ad_id}&utm_term={keyword}",
  },
  {
    name: "Zerocoder Реклама / Вика Facebook",
    baseUrl: "https://zerocoder.ru/landing",
    source: "vika_fb_Mir",
    medium: "динамичная",
    campaign: "{{adset.name}}",
    content: "{{ad.name}}",
    term: "",
    expected_url:
      "https://zerocoder.ru/landing?utm_source=vika_fb_Mir&utm_medium=%D0%B4%D0%B8%D0%BD%D0%B0%D0%BC%D0%B8%D1%87%D0%BD%D0%B0%D1%8F&utm_campaign={{adset.name}}&utm_content={{ad.name}}",
  },
  {
    name: "Zerocoder Геткурс / Все тренинги",
    baseUrl: "https://zerocoder.ru/training",
    source: "getcourse",
    medium: "zerocoder",
    campaign: "training",
    content: "",
    term: "",
    expected_url:
      "https://zerocoder.ru/training?utm_source=getcourse&utm_medium=zerocoder&utm_campaign=training",
  },
  {
    name: "Zerocoder Геткурс / Запись вебинара",
    baseUrl: "https://zerocoder.ru/webinar-rec",
    source: "site",
    medium: "getcourse",
    campaign: "neuroteen",
    content: "record",
    term: "",
    expected_url:
      "https://zerocoder.ru/webinar-rec?utm_source=site&utm_medium=getcourse&utm_campaign=neuroteen&utm_content=record",
  },
  {
    name: "Zerocoder Гайд / Email Почта → content=guide, campaign=site.tag",
    baseUrl: "https://university.zerocoder.ru/demo-neuro-kids_order_mail",
    source: "email",
    medium: "zerocoder",
    campaign: "neuroteen", // site.tag, не URL slug
    content: "guide",
    term: "",
    expected_url:
      "https://university.zerocoder.ru/demo-neuro-kids_order_mail?utm_source=email&utm_medium=zerocoder&utm_campaign=neuroteen&utm_content=guide",
  },
  {
    name: "Zerocoder Гайд / Телеграм-бот",
    baseUrl: "https://zerocoder.ru/promo",
    source: "telegram",
    medium: "bot_zerocoder",
    campaign: "spring-promo",
    content: "guide",
    term: "",
    expected_url:
      "https://zerocoder.ru/promo?utm_source=telegram&utm_medium=bot_zerocoder&utm_campaign=spring-promo&utm_content=guide",
  },
  {
    name: "Zerocoder Гайд / ВК-бот",
    baseUrl: "https://zerocoder.ru/promo",
    source: "vk",
    medium: "zerocoders",
    campaign: "vk-target",
    content: "guide",
    term: "",
    expected_url:
      "https://zerocoder.ru/promo?utm_source=vk&utm_medium=zerocoders&utm_campaign=vk-target&utm_content=guide",
  },

  // ====================================
  //       EDGE CASES / ВАЛИДАЦИЯ
  // ====================================
  {
    name: "Пустой source/medium — параметры пропускаются",
    baseUrl: "https://example.com",
    source: "",
    medium: "",
    campaign: "test",
    content: "",
    term: "",
    expected_url: "https://example.com?utm_campaign=test",
  },
  {
    name: "Все поля пустые — base URL без параметров",
    baseUrl: "https://example.com/page",
    source: "",
    medium: "",
    campaign: "",
    content: "",
    term: "",
    expected_url: "https://example.com/page",
  },
  {
    name: "Плейсхолдеры Яндекса не кодируются ({campaign_id})",
    baseUrl: "https://example.com",
    source: "yandex",
    medium: "cpc",
    campaign: "{campaign_id}",
    content: "{ad_id}",
    term: "{keyword}",
    expected_url:
      "https://example.com?utm_source=yandex&utm_medium=cpc&utm_campaign={campaign_id}&utm_content={ad_id}&utm_term={keyword}",
  },
  {
    name: "Двойные плейсхолдеры Facebook ({{adset_id}})",
    baseUrl: "https://example.com",
    source: "fb",
    medium: "valeriy",
    campaign: "{{adset_id}}",
    content: "{{ad_id}}",
    term: "",
    expected_url:
      "https://example.com?utm_source=fb&utm_medium=valeriy&utm_campaign={{adset_id}}&utm_content={{ad_id}}",
  },
];

let pass = 0;
let fail = 0;

for (const s of scenarios) {
  const url = buildUtm(s.baseUrl, {
    source: s.source,
    medium: s.medium,
    campaign: s.campaign,
    content: s.content,
    term: s.term,
  });
  const ok = url === s.expected_url;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "OK  " : "FAIL"} ${s.name}`);
  if (!ok) {
    console.log(`     ожидали: ${s.expected_url}`);
    console.log(`     получили: ${url}`);
  }
}

console.log(`\n${pass} ok, ${fail} fail (из ${scenarios.length})`);
if (fail > 0) process.exit(1);
