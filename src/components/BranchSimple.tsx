"use client";

import { useMemo, useState } from "react";
import type { Channel, Site } from "@/db/queries";
import { extractUrlSlug } from "@/lib/utm";
import EditableUtm from "./EditableUtm";
import CustomSiteFinishButtons from "./CustomSiteFinishButtons";

// Универсальная ветка: канал → сайт → результат.
// Используется для типов задач, где defaults полностью заданы в канале
// (default_content, default_term). Шаг даты не показывается — если term
// фиксированный, дата не нужна; если term пустой, юзер заполнит в паровозике.

type Props = {
  branch: string;
  branchLabel: string;
  channels: Channel[];
  sites: Site[];
  companySlug: string;
  onBack: () => void;
  onReset: () => void;
};

type SimpleStep = "channel" | "site" | "article" | "result";

export default function BranchSimple({
  branch,
  branchLabel,
  channels,
  sites,
  companySlug,
  onBack,
  onReset,
}: Props) {
  const [step, setStep] = useState<SimpleStep>("channel");

  const [channel, setChannel] = useState<Channel | null>(null);
  const [customSource, setCustomSource] = useState("");
  const [customMedium, setCustomMedium] = useState("");

  const [site, setSite] = useState<Site | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [articleUrl, setArticleUrl] = useState("");

  const isZerocoder = companySlug === "zerocoder";
  const isBlog = branch === "blog";

  const branchChannels = useMemo(
    () => channels.filter((c) => c.branch === branch),
    [channels, branch]
  );

  function selectChannel(c: Channel) {
    setChannel(c);
    setStep("site");
  }

  function confirmCustomChannel() {
    if (!customSource.trim() && !customMedium.trim()) return;
    setChannel({
      id: -1,
      branch,
      group_name: null,
      display_name: "Свой вариант",
      utm_source: customSource.trim(),
      utm_medium: customMedium.trim() || null,
      needs_url_slug: false,
      needs_manual_medium: false,
      default_content: null,
      default_term: null,
    });
    setStep("site");
  }

  function selectSite(s: Site) {
    setSite(s);
    setStep(isBlog ? "article" : "result");
  }

  function confirmCustomSite() {
    if (!customUrl.trim()) return;
    // Для Zerocoder требуем тег отдельно. Для других — извлекаем из URL.
    if (isZerocoder && !customTag.trim()) return;
    setSite({
      id: -1,
      url: customUrl.trim(),
      tag: isZerocoder ? customTag.trim() : extractUrlSlug(customUrl.trim()),
    });
    setStep(isBlog ? "article" : "result");
  }

  function confirmArticle() {
    if (!articleUrl.trim()) return;
    setStep("result");
  }

  function backStep() {
    if (step === "site") {
      setSite(null);
      setStep("channel");
    } else if (step === "article") {
      setStep("site");
    } else if (step === "result") {
      setStep(isBlog ? "article" : "site");
    }
  }

  return (
    <section>
      <Breadcrumbs branchLabel={branchLabel} channel={channel} site={site} />

      {step === "channel" && (
        <StepChannel
          branchLabel={branchLabel}
          channels={branchChannels}
          customSource={customSource}
          setCustomSource={setCustomSource}
          customMedium={customMedium}
          setCustomMedium={setCustomMedium}
          onSelect={selectChannel}
          onConfirmCustom={confirmCustomChannel}
        />
      )}

      {step === "site" && (
        <StepSite
          sites={sites}
          customUrl={customUrl}
          setCustomUrl={setCustomUrl}
          customTag={customTag}
          setCustomTag={setCustomTag}
          isZerocoder={isZerocoder}
          companySlug={companySlug}
          onSelect={selectSite}
          onConfirmCustom={confirmCustomSite}
        />
      )}

      {step === "article" && (
        <StepArticle
          articleUrl={articleUrl}
          setArticleUrl={setArticleUrl}
          onConfirm={confirmArticle}
        />
      )}

      {step === "result" && channel && site && (
        <StepResult
          channel={channel}
          site={site}
          articleUrl={isBlog ? articleUrl : null}
        />
      )}

      <div className="flex gap-4 mt-6">
        {step !== "channel" && (
          <button
            onClick={backStep}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            ← назад
          </button>
        )}
        <button
          onClick={step === "channel" ? onBack : onReset}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          {step === "channel" ? "← к типу задачи" : "↺ начать заново"}
        </button>
      </div>
    </section>
  );
}

function Breadcrumbs({
  branchLabel,
  channel,
  site,
}: {
  branchLabel: string;
  channel: Channel | null;
  site: Site | null;
}) {
  const parts: string[] = [branchLabel];
  if (channel) parts.push(channel.display_name);
  if (site) {
    const short = site.url.replace("https://", "").replace("http://", "");
    parts.push(short.length > 30 ? short.slice(0, 30) + "…" : short);
  }
  return <p className="text-sm text-[var(--text-muted)] mb-4">{parts.join(" → ")}</p>;
}

function StepChannel({
  branchLabel,
  channels,
  customSource,
  setCustomSource,
  customMedium,
  setCustomMedium,
  onSelect,
  onConfirmCustom,
}: {
  branchLabel: string;
  channels: Channel[];
  customSource: string;
  setCustomSource: (v: string) => void;
  customMedium: string;
  setCustomMedium: (v: string) => void;
  onSelect: (c: Channel) => void;
  onConfirmCustom: () => void;
}) {
  const [showCustom, setShowCustom] = useState(false);

  // Группировка каналов по group_name (если задана)
  const groups = useMemo(() => {
    const map = new Map<string, Channel[]>();
    for (const c of channels) {
      const key = c.group_name || "_default";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [channels]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{branchLabel}: канал</h2>

      <div className="space-y-4 mb-4">
        {groups.map(([groupName, items]) => (
          <div key={groupName}>
            {groupName !== "_default" && groups.length > 1 && (
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">
                {groupName}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="border border-[var(--border)] rounded-lg px-4 py-3 text-left hover:border-[var(--accent)] hover:bg-[var(--bg)] transition"
                >
                  <div className="font-semibold text-sm">{c.display_name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                    {c.utm_source || "—"} / {c.utm_medium ?? "—"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowCustom(true)}
        className={`block w-full border rounded-lg px-5 py-4 text-left transition ${
          showCustom
            ? "border-[var(--accent)] bg-[var(--bg)]"
            : "border-dashed border-[var(--border)] hover:border-[var(--accent)]"
        }`}
      >
        <div className="font-semibold">Свой вариант</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          ввести utm_source и utm_medium вручную
        </div>
      </button>

      {showCustom && (
        <div className="mt-4 space-y-2">
          <input
            type="text"
            value={customSource}
            onChange={(e) => setCustomSource(e.target.value)}
            placeholder="utm_source"
            className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="text"
            value={customMedium}
            onChange={(e) => setCustomMedium(e.target.value)}
            placeholder="utm_medium"
            className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={onConfirmCustom}
            className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)]"
          >
            Дальше →
          </button>
        </div>
      )}
    </div>
  );
}

function StepSite({
  sites,
  customUrl,
  setCustomUrl,
  customTag,
  setCustomTag,
  isZerocoder,
  companySlug,
  onSelect,
  onConfirmCustom,
}: {
  sites: Site[];
  customUrl: string;
  setCustomUrl: (v: string) => void;
  customTag: string;
  setCustomTag: (v: string) => void;
  isZerocoder: boolean;
  companySlug: string;
  onSelect: (s: Site) => void;
  onConfirmCustom: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return sites;
    return sites.filter(
      (s) => s.url.toLowerCase().includes(f) || s.tag.toLowerCase().includes(f)
    );
  }, [sites, filter]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Сайт</h2>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Поиск по URL или тегу..."
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-3"
      />

      {sites.length > 0 && (
        <ul className="max-h-80 overflow-y-auto border border-[var(--border)] rounded divide-y divide-[var(--border)] mb-4">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s)}
                className="w-full flex items-center justify-between gap-4 px-4 py-2.5 text-sm text-left hover:bg-[var(--bg)] transition"
              >
                <span className="text-[var(--text)] truncate">{s.url}</span>
                <code className="text-xs bg-[var(--surface)] px-2 py-0.5 rounded shrink-0">
                  {s.tag}
                </code>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-[var(--text-muted)]">
              Ничего не найдено
            </li>
          )}
        </ul>
      )}

      <button
        onClick={() => setShowCustom(true)}
        className={`block w-full border rounded-lg px-5 py-4 text-left transition ${
          showCustom
            ? "border-[var(--accent)] bg-[var(--bg)]"
            : "border-dashed border-[var(--border)] hover:border-[var(--accent)]"
        }`}
      >
        <div className="font-semibold">Свой вариант</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          {isZerocoder
            ? "ввести URL и тег активности вручную"
            : "ввести URL вручную (хвост посчитается автоматом)"}
        </div>
      </button>

      {showCustom && (
        <div className="mt-4 space-y-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          {isZerocoder && (
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="тег активности (utm_campaign), напр. neuroteen"
              className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          )}
          <CustomSiteFinishButtons
            url={customUrl}
            tag={isZerocoder ? customTag : undefined}
            companySlug={companySlug}
            disabled={!customUrl.trim() || (isZerocoder && !customTag.trim())}
            onProceed={onConfirmCustom}
          />
        </div>
      )}
    </div>
  );
}

function StepArticle({
  articleUrl,
  setArticleUrl,
  onConfirm,
}: {
  articleUrl: string;
  setArticleUrl: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">URL статьи (где размещена ссылка)</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        Полный URL статьи, в которой стоит ссылка. Пойдёт в{" "}
        <code>utm_content</code>.
      </p>
      <input
        type="url"
        value={articleUrl}
        onChange={(e) => setArticleUrl(e.target.value)}
        placeholder="https://zerocoder.ru/blog/article-name"
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-3"
      />
      <button
        onClick={onConfirm}
        disabled={!articleUrl.trim()}
        className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        Дальше →
      </button>
    </div>
  );
}

function StepResult({
  channel,
  site,
  articleUrl,
}: {
  channel: Channel;
  site: Site;
  articleUrl: string | null;
}) {
  const campaign = site.tag || extractUrlSlug(site.url);
  // Для блога content = URL статьи, иначе берём дефолт канала
  const content = articleUrl ?? channel.default_content ?? "";

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Готовая UTM</h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Любое поле можно поправить через «✏️ Редактировать вручную».
      </p>
      <EditableUtm
        initial={{
          baseUrl: site.url,
          source: channel.utm_source,
          medium: channel.utm_medium ?? "",
          campaign,
          content,
          term: channel.default_term ?? "",
        }}
      />
    </div>
  );
}
