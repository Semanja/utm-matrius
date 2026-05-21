"use client";

import { useMemo, useState } from "react";
import type { Channel, Site } from "@/db/queries";
import { extractUrlSlug } from "@/lib/utm";
import EditableUtm from "./EditableUtm";
import CustomSiteFinishButtons from "./CustomSiteFinishButtons";

type Props = {
  channels: Channel[];
  sites: Site[];
  companySlug: string;
  onBack: () => void;
  onReset: () => void;
};

type SmmStep = "channel" | "site" | "date" | "result";

export default function BranchSmm({
  channels,
  sites,
  companySlug,
  onBack,
  onReset,
}: Props) {
  const [step, setStep] = useState<SmmStep>("channel");

  const [channel, setChannel] = useState<Channel | null>(null);
  const [customSource, setCustomSource] = useState("");
  const [customMedium, setCustomMedium] = useState("");

  const [site, setSite] = useState<Site | null>(null);
  const [customUrl, setCustomUrl] = useState("");

  const [date, setDate] = useState<string>(today());

  const smmChannels = useMemo(
    () => channels.filter((c) => c.branch === "smm"),
    [channels]
  );

  function selectChannel(c: Channel) {
    setChannel(c);
    setStep("site");
  }

  function confirmCustomChannel() {
    if (!customSource.trim() || !customMedium.trim()) return;
    setChannel({
      id: -1,
      branch: "smm",
      group_name: null,
      display_name: "Свой вариант",
      utm_source: customSource.trim(),
      utm_medium: customMedium.trim(),
      needs_url_slug: false,
      needs_manual_medium: false,
    });
    setStep("site");
  }

  function selectSite(s: Site) {
    setSite(s);
    setStep("date");
  }

  function confirmCustomSite() {
    if (!customUrl.trim()) return;
    setSite({ id: -1, url: customUrl.trim(), tag: "" });
    setStep("date");
  }

  function confirmDate() {
    if (!date) return;
    setStep("result");
  }

  function backStep() {
    if (step === "site") {
      setSite(null);
      setStep("channel");
    } else if (step === "date") {
      setStep("site");
    } else if (step === "result") {
      setStep("date");
    }
  }

  return (
    <section>
      <SmmBreadcrumbs
        channel={channel}
        site={site}
        date={date}
        step={step}
      />

      {step === "channel" && (
        <StepChannel
          channels={smmChannels}
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
          companySlug={companySlug}
          onSelect={selectSite}
          onConfirmCustom={confirmCustomSite}
        />
      )}

      {step === "date" && (
        <StepDate date={date} setDate={setDate} onConfirm={confirmDate} />
      )}

      {step === "result" && channel && site && (
        <StepResult channel={channel} site={site} date={date} />
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

function SmmBreadcrumbs({
  channel,
  site,
  date,
  step,
}: {
  channel: Channel | null;
  site: Site | null;
  date: string;
  step: SmmStep;
}) {
  const parts: string[] = ["СММ"];
  if (channel) parts.push(channel.display_name);
  if (site) {
    const short = site.url.replace("https://", "").replace("http://", "");
    parts.push(short.length > 30 ? short.slice(0, 30) + "…" : short);
  }
  if (step === "result" && date) parts.push(formatDateDisplay(date));
  return <p className="text-sm text-[var(--text-muted)] mb-4">{parts.join(" → ")}</p>;
}

function StepChannel({
  channels,
  customSource,
  setCustomSource,
  customMedium,
  setCustomMedium,
  onSelect,
  onConfirmCustom,
}: {
  channels: Channel[];
  customSource: string;
  setCustomSource: (v: string) => void;
  customMedium: string;
  setCustomMedium: (v: string) => void;
  onSelect: (c: Channel) => void;
  onConfirmCustom: () => void;
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Шаг 2: Канал</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {channels.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className="border border-[var(--border)] rounded-lg px-5 py-4 text-left hover:border-[var(--accent)] hover:bg-[var(--bg)] transition"
          >
            <div className="font-semibold">{c.display_name}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
              {c.utm_source} / {c.utm_medium}
            </div>
          </button>
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
  companySlug,
  onSelect,
  onConfirmCustom,
}: {
  sites: Site[];
  customUrl: string;
  setCustomUrl: (v: string) => void;
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
      <h2 className="text-xl font-semibold mb-4">Шаг 3: Сайт</h2>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Поиск по URL или тегу..."
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-3"
      />

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
          ввести URL вручную (хвост посчитается автоматом)
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
          <CustomSiteFinishButtons
            url={customUrl}
            companySlug={companySlug}
            disabled={!customUrl.trim()}
            onProceed={onConfirmCustom}
          />
        </div>
      )}
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
  const min = today();
  const max = todayPlusDays(14);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Шаг 4: Дата</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        От сегодня до +14 дней. В <code>utm_term</code> попадёт как{" "}
        <code>date_дд.мм.гг</code>.
      </p>
      <input
        type="date"
        value={date}
        min={min}
        max={max}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-2"
      />
      <p className="text-sm text-[var(--text-muted)] mb-4">
        В метку:{" "}
        <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded">
          date_{formatDateDisplay(date)}
        </code>
      </p>
      <button
        onClick={onConfirm}
        className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)]"
      >
        Собрать UTM →
      </button>
    </div>
  );
}

function StepResult({
  channel,
  site,
  date,
}: {
  channel: Channel;
  site: Site;
  date: string;
}) {
  const utmTerm = `date_${formatDateDisplay(date)}`;
  const campaign = extractUrlSlug(site.url);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Готовая UTM</h2>
      <EditableUtm
        initial={{
          baseUrl: site.url,
          source: channel.utm_source,
          medium: channel.utm_medium ?? "",
          campaign,
          content: "post",
          term: utmTerm,
        }}
      />
    </div>
  );
}

function today(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function todayPlusDays(n: number): string {
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
