export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

export function buildUtm(baseUrl: string, params: UtmParams): string {
  const url = new URL(baseUrl);
  const map: { key: string; value: string | undefined }[] = [
    { key: "utm_source", value: params.source },
    { key: "utm_medium", value: params.medium },
    { key: "utm_campaign", value: params.campaign },
    { key: "utm_content", value: params.content },
    { key: "utm_term", value: params.term },
  ];
  for (const { key, value } of map) {
    if (value && value.trim() !== "") {
      url.searchParams.set(key, value.trim());
    }
  }
  return url.toString();
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
