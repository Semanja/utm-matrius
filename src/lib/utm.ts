export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

// Кодирует, но сохраняет фигурные скобки `{` и `}` — для плейсхолдеров типа {campaign_id}, {ad_id}
// которые подставляются рекламными сетями (Яндекс.Директ, FB, Google).
export function encodePreservePlaceholders(value: string): string {
  return encodeURIComponent(value)
    .replace(/%7B/g, "{")
    .replace(/%7D/g, "}");
}

export function buildUtm(baseUrl: string, params: UtmParams): string {
  const fields: { key: string; value: string | undefined }[] = [
    { key: "utm_source", value: params.source },
    { key: "utm_medium", value: params.medium },
    { key: "utm_campaign", value: params.campaign },
    { key: "utm_content", value: params.content },
    { key: "utm_term", value: params.term },
  ];
  const parts: string[] = [];
  for (const { key, value } of fields) {
    const v = (value || "").trim();
    if (v) parts.push(`${key}=${encodePreservePlaceholders(v)}`);
  }
  if (parts.length === 0) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}${parts.join("&")}`;
}

// Хвост ленда — то, что после слеша. Если path пустой — берём домен.
// https://matrius.online/freemaths → "freemaths"
// https://matrius.online/         → "matrius.online"
export function extractUrlSlug(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    if (path) return path;
    return u.hostname;
  } catch {
    return url;
  }
}
