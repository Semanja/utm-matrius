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

type SimpleStep =
  | "channel"
  | "campaign" // только для external — категория + тег
  | "speaker" // только для external — имя спикера
  | "site"
  | "article" // только для blog — URL статьи
  | "date" // для external и blog
  | "result";

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
  const [campaignCategory, setCampaignCategory] = useState<string>("партнер");
  const [campaignValue, setCampaignValue] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [date, setDate] = useState<string>(todayISO());

  const isZerocoder = companySlug === "zerocoder";
  const isBlog = branch === "blog";
  const isExternal = branch === "external";
  const needsDate = isBlog || isExternal;

  const branchChannels = useMemo(
    () => channels.filter((c) => c.branch === branch),
    [channels, branch]
  );

  function nextAfterChannel() {
    setStep(isExternal ? "campaign" : "site");
  }

  function selectChannel(c: Channel) {
    setChannel(c);
    nextAfterChannel();
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
    nextAfterChannel();
  }

  function confirmCampaign() {
    if (!campaignValue.trim()) return;
    setStep("speaker");
  }

  function confirmSpeaker() {
    if (!speakerName.trim()) return;
    setStep("site");
  }

  function nextAfterSite() {
    if (isBlog) setStep("article");
    else if (needsDate) setStep("date");
    else setStep("result");
  }

  function selectSite(s: Site) {
    setSite(s);
    nextAfterSite();
  }

  function confirmCustomSite() {
    if (!customUrl.trim()) return;
    if (isZerocoder && !customTag.trim()) return;
    setSite({
      id: -1,
      url: customUrl.trim(),
      tag: isZerocoder ? customTag.trim() : extractUrlSlug(customUrl.trim()),
    });
    nextAfterSite();
  }

  function confirmArticle() {
    if (!articleUrl.trim()) return;
    setStep(needsDate ? "date" : "result");
  }

  function confirmDate() {
    if (!date) return;
    setStep("result");
  }

  function backStep() {
    if (step === "campaign") setStep("channel");
    else if (step === "speaker") setStep("campaign");
    else if (step === "site") setStep(isExternal ? "speaker" : "channel");
    else if (step === "article") setStep("site");
    else if (step === "date") setStep(isBlog ? "article" : "site");
    else if (step === "result") setStep(needsDate ? "date" : isBlog ? "article" : "site");
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

      {step === "campaign" && (
        <StepCampaign
          category={campaignCategory}
          setCategory={setCampaignCategory}
          value={campaignValue}
          setValue={setCampaignValue}
          onConfirm={confirmCampaign}
        />
      )}

      {step === "speaker" && (
        <StepSpeaker
          name={speakerName}
          setName={setSpeakerName}
          onConfirm={confirmSpeaker}
        />
      )}

      {step === "article" && (
        <StepArticle
          articleUrl={articleUrl}
          setArticleUrl={setArticleUrl}
          onConfirm={confirmArticle}
        />
      )}

      {step === "date" && (
        <StepDate date={date} setDate={setDate} onConfirm={confirmDate} />
      )}

      {step === "result" && channel && site && (
        <StepResult
          channel={channel}
          site={site}
          articleUrl={isBlog ? articleUrl : null}
          campaignOverride={isExternal ? campaignValue : null}
          speakerOverride={isExternal ? speakerName : null}
          dateValue={needsDate ? date : null}
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

function StepCampaign({
  category,
  setCategory,
  value,
  setValue,
  onConfirm,
}: {
  category: string;
  setCategory: (v: string) => void;
  value: string;
  setValue: (v: string) => void;
  onConfirm: () => void;
}) {
  const options = [
    { value: "партнер", label: "Партнёр", hint: "имя/название партнёра" },
    { value: "вебинар", label: "Вебинар", hint: "тег вебинара" },
    { value: "тег активности", label: "Тег активности", hint: "общий тег" },
  ];
  const current = options.find((o) => o.value === category) ?? options[0];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Тег кампании</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        Выбери тип, потом введи конкретное значение. Пойдёт в{" "}
        <code>utm_campaign</code>.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setCategory(o.value)}
            className={`text-sm px-3 py-1.5 rounded border transition ${
              category === o.value
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]"
                : "border-[var(--border)] hover:border-[var(--accent)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={current.hint}
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-3"
      />
      <button
        onClick={onConfirm}
        disabled={!value.trim()}
        className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        Дальше →
      </button>
    </div>
  );
}

function StepSpeaker({
  name,
  setName,
  onConfirm,
}: {
  name: string;
  setName: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Имя спикера</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        Имя выступающего. Пойдёт в <code>utm_content</code>.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="например: Иван Иванов"
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-3"
      />
      <button
        onClick={onConfirm}
        disabled={!name.trim()}
        className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        Дальше →
      </button>
    </div>
  );
}

function StepDate({
  date,
  setDate,
  onConfirm,
}: {
  date: string;
  setDate: (d: string) => void;
  onConfirm: () => void;
}) {
  const min = todayISO();
  const max = todayPlusDaysISO(14);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Дата</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        От сегодня до +14 дней. В <code>utm_term</code> попадёт как{" "}
        <code>дд.мм.гг</code>.
      </p>
      <input
        type="date"
        value={date}
        min={min}
        max={max}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-2"
      />
      <p className="text-sm text-[var(--text-muted)] mb-3">
        В метку:{" "}
        <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded">
          {formatDateDisplay(date)}
        </code>
      </p>
      <button
        onClick={onConfirm}
        className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)]"
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
  campaignOverride,
  speakerOverride,
  dateValue,
}: {
  channel: Channel;
  site: Site;
  articleUrl: string | null;
  campaignOverride: string | null;
  speakerOverride: string | null;
  dateValue: string | null;
}) {
  const campaign =
    campaignOverride !== null && campaignOverride !== ""
      ? campaignOverride
      : site.tag || extractUrlSlug(site.url);

  // Контент: для блога — URL статьи; для external — имя спикера; иначе дефолт канала
  const content =
    articleUrl !== null && articleUrl !== ""
      ? articleUrl
      : speakerOverride !== null && speakerOverride !== ""
      ? speakerOverride
      : channel.default_content ?? "";

  // Term: если есть дата — дд.мм.гг (без префикса для Zerocoder); иначе дефолт канала
  const term = dateValue
    ? formatDateDisplay(dateValue)
    : channel.default_term ?? "";

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
          term,
        }}
      />
    </div>
  );
}

function todayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function todayPlusDaysISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateDisplay(yyyymmdd: string): string {
  if (!yyyymmdd || !yyyymmdd.includes("-")) return "";
  const [y, m, d] = yyyymmdd.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}
