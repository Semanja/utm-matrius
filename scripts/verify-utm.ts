// Проверяет генерацию UTM по сценариям из ТЗ.
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

const TEST_DATE_NN = "date_20.05.26"; // для анонс/смм формата nn.nn.nn
const TEST_DATE_MM = "05.26"; // для гайда формата mm.yy

const scenarios: Scenario[] = [
  // ============ MATRIUS ============
  {
    name: "Matrius Анонс / Email · Unisender / freemaths",
    baseUrl: "https://matrius.online/freemaths",
    source: "email",
    medium: "unisender",
    campaign: extractUrlSlug("https://matrius.online/freemaths"),
    content: "announce",
    term: TEST_DATE_NN,
    expected_url:
      "https://matrius.online/freemaths?utm_source=email&utm_medium=unisender&utm_campaign=freemaths&utm_content=announce&utm_term=date_20.05.26",
  },
  {
    name: "Matrius Анонс / Email · Геткурс / matematika",
    baseUrl: "https://matrius.online/matematika",
    source: "email",
    medium: "getcourse",
    campaign: extractUrlSlug("https://matrius.online/matematika"),
    content: "announce",
    term: TEST_DATE_NN,
    expected_url:
      "https://matrius.online/matematika?utm_source=email&utm_medium=getcourse&utm_campaign=matematika&utm_content=announce&utm_term=date_20.05.26",
  },
  {
    name: "Matrius СММ / ВК-пост / lesson30min",
    baseUrl: "https://matrius.online/lesson30min",
    source: "vk",
    medium: "matrius_ru",
    campaign: extractUrlSlug("https://matrius.online/lesson30min"),
    content: "post",
    term: TEST_DATE_NN,
    expected_url:
      "https://matrius.online/lesson30min?utm_source=vk&utm_medium=matrius_ru&utm_campaign=lesson30min&utm_content=post&utm_term=date_20.05.26",
  },
  {
    name: "Matrius Гайд / Скорочтение / triallessonspeedreading / qr",
    baseUrl: "https://matrius.online/triallessonspeedreading",
    source: "pdf",
    medium: "skorochtenie",
    campaign: "show-sr-flow-1", // site.tag (не URL slug!)
    content: "qr",
    term: TEST_DATE_MM,
    expected_url:
      "https://matrius.online/triallessonspeedreading?utm_source=pdf&utm_medium=skorochtenie&utm_campaign=show-sr-flow-1&utm_content=qr&utm_term=05.26",
  },
  {
    name: "Matrius Реклама / Артём · Я.Директ (URL slug → campaign)",
    baseUrl: "https://matrius.online/lesson30min",
    source: "yandex",
    medium: "artem",
    campaign: extractUrlSlug("https://matrius.online/lesson30min"), // URL slug, не site.tag
    content: "",
    term: "",
    expected_url:
      "https://matrius.online/lesson30min?utm_source=yandex&utm_medium=artem&utm_campaign=lesson30min",
  },
  {
    name: "Matrius Реклама / Илья · Я.Директ (medium с хвостиком)",
    baseUrl: "https://matrius.online/lesson30min",
    source: "yandex",
    medium: "ilya_" + extractUrlSlug("https://matrius.online/lesson30min"),
    campaign: "lesson-flow-1", // site.tag
    content: "",
    term: "",
    expected_url:
      "https://matrius.online/lesson30min?utm_source=yandex&utm_medium=ilya_lesson30min&utm_campaign=lesson-flow-1",
  },
  {
    name: "Matrius Реклама / Евгения · VK-ads (medium с хвостиком)",
    baseUrl: "https://matrius.online/freemaths",
    source: "vk-ads",
    medium: "evgenia_freemaths",
    campaign: "show-math-flow-1",
    content: "",
    term: "",
    expected_url:
      "https://matrius.online/freemaths?utm_source=vk-ads&utm_medium=evgenia_freemaths&utm_campaign=show-math-flow-1",
  },

  // ============ ZEROCODER ============
  {
    name: "Zerocoder Анонс / Почта / какая-то страница",
    baseUrl: "https://zerocoder.ru/webinar-test",
    source: "email",
    medium: "zerocoder",
    campaign: extractUrlSlug("https://zerocoder.ru/webinar-test"),
    content: "announce",
    term: TEST_DATE_NN,
    expected_url:
      "https://zerocoder.ru/webinar-test?utm_source=email&utm_medium=zerocoder&utm_campaign=webinar-test&utm_content=announce&utm_term=date_20.05.26",
  },
  {
    name: "Zerocoder Анонс / ТГ-бот геткурс",
    baseUrl: "https://zerocoder.ru/promo",
    source: "telegram",
    medium: "zerocoder-gc",
    campaign: extractUrlSlug("https://zerocoder.ru/promo"),
    content: "announce",
    term: TEST_DATE_NN,
    expected_url:
      "https://zerocoder.ru/promo?utm_source=telegram&utm_medium=zerocoder-gc&utm_campaign=promo&utm_content=announce&utm_term=date_20.05.26",
  },
  {
    name: "Zerocoder Воронка / Продажное письмо ТГ-бот",
    baseUrl: "https://zerocoder.ru/webinar",
    source: "telegram",
    medium: "bot_zerocoder",
    campaign: "webinar", // tag = URL slug для Zerocoder
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
    name: "Zerocoder Внешние / Спикерство",
    baseUrl: "https://zerocoder.ru/partner-event",
    source: "pr",
    medium: "speech",
    campaign: "partner-event",
    content: "спикер",
    term: "",
    expected_url:
      "https://zerocoder.ru/partner-event?utm_source=pr&utm_medium=speech&utm_campaign=partner-event&utm_content=%D1%81%D0%BF%D0%B8%D0%BA%D0%B5%D1%80",
  },
  {
    name: "Zerocoder Блог / Журнал",
    baseUrl: "https://zerocoder.ru/article",
    source: "magazine",
    medium: "article",
    campaign: "article",
    content: "url-статья",
    term: "",
    expected_url:
      "https://zerocoder.ru/article?utm_source=magazine&utm_medium=article&utm_campaign=article&utm_content=url-%D1%81%D1%82%D0%B0%D1%82%D1%8C%D1%8F",
  },
  {
    name: "Zerocoder Реклама / Вика Я.Директ (плейсхолдеры Яндекса)",
    baseUrl: "https://zerocoder.ru/landing",
    source: "yandex",
    medium: "vika",
    campaign: "{campaign_id}",
    content: "{ad_id}",
    term: "{keyword}",
    expected_url:
      "https://zerocoder.ru/landing?utm_source=yandex&utm_medium=vika&utm_campaign={campaign_id}&utm_content={ad_id}&utm_term={keyword}",
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

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
