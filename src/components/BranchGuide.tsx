"use client";

import { useMemo, useState } from "react";
import type { Site } from "@/db/queries";
import { suggestSlugs } from "@/lib/translit";
import EditableUtm from "./EditableUtm";
import CustomSiteFinishButtons from "./CustomSiteFinishButtons";

type Props = {
  sites: Site[];
  placements: { value: string; display_name: string | null }[];
  companySlug: string;
  onBack: () => void;
  onReset: () => void;
};

type GuideStep = "name" | "site" | "placement" | "date" | "result";

export default function BranchGuide({
  sites,
  placements,
  companySlug,
  onBack,
  onReset,
}: Props) {
  const [step, setStep] = useState<GuideStep>("name");

  const [nameRu, setNameRu] = useState<string>("");
  const [slug, setSlug] = useState<string>("");

  const [site, setSite] = useState<Site | null>(null);
  const [customUrl, setCustomUrl] = useState<string>("");
  const [customTag, setCustomTag] = useState<string>("");

  const [placement, setPlacement] = useState<string>("");
  const [customPlacement, setCustomPlacement] = useState<string>("");

  const [date, setDate] = useState<string>(currentMonth());

  function confirmName() {
    if (!slug.trim()) return;
    setStep("site");
  }

  function selectSite(s: Site) {
    setSite(s);
    setStep("placement");
  }

  function confirmCustomSite() {
    if (!customUrl.trim() || !customTag.trim()) return;
    setSite({ id: -1, url: customUrl.trim(), tag: customTag.trim() });
    setStep("placement");
  }

  function selectPlacement(p: string) {
    setPlacement(p);
    setStep("date");
  }

  function confirmCustomPlacement() {
    if (!customPlacement.trim()) return;
    setPlacement(customPlacement.trim());
    setStep("date");
  }

  function confirmDate() {
    if (!date) return;
    setStep("result");
  }

  function backStep() {
    if (step === "site") setStep("name");
    else if (step === "placement") {
      setSite(null);
      setStep("site");
    } else if (step === "date") {
      setPlacement("");
      setStep("placement");
    } else if (step === "result") setStep("date");
  }

  return (
    <section>
      <GuideBreadcrumbs
        nameRu={nameRu}
        slug={slug}
        site={site}
        placement={placement}
        date={date}
        step={step}
      />

      {step === "name" && (
        <StepName
          nameRu={nameRu}
          setNameRu={setNameRu}
          slug={slug}
          setSlug={setSlug}
          onConfirm={confirmName}
        />
      )}

      {step === "site" && (
        <StepSite
          sites={sites}
          customUrl={customUrl}
          setCustomUrl={setCustomUrl}
          customTag={customTag}
          setCustomTag={setCustomTag}
          companySlug={companySlug}
          onSelect={selectSite}
          onConfirmCustom={confirmCustomSite}
        />
      )}

      {step === "placement" && (
        <StepPlacement
          placements={placements}
          customPlacement={customPlacement}
          setCustomPlacement={setCustomPlacement}
          onSelect={selectPlacement}
          onConfirmCustom={confirmCustomPlacement}
        />
      )}

      {step === "date" && (
        <StepDate date={date} setDate={setDate} onConfirm={confirmDate} />
      )}

      {step === "result" && site && (
        <StepResult slug={slug} site={site} placement={placement} date={date} />
      )}

      <div className="flex gap-4 mt-6">
        {step !== "name" && (
          <button
            onClick={backStep}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            ← назад
          </button>
        )}
        <button
          onClick={step === "name" ? onBack : onReset}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          {step === "name" ? "← к типу задачи" : "↺ начать заново"}
        </button>
      </div>
    </section>
  );
}

function GuideBreadcrumbs({
  nameRu,
  slug,
  site,
  placement,
  date,
  step,
}: {
  nameRu: string;
  slug: string;
  site: Site | null;
  placement: string;
  date: string;
  step: GuideStep;
}) {
  const parts: string[] = ["Гайд"];
  if (slug) parts.push(nameRu ? `${nameRu} (${slug})` : slug);
  if (site) {
    const short = site.url.replace("https://", "").replace("http://", "");
    parts.push(short.length > 30 ? short.slice(0, 30) + "…" : short);
  }
  if (placement) parts.push(placement);
  if (step === "result" && date) parts.push(formatMonthDisplay(date));
  return <p className="text-sm text-[var(--text-muted)] mb-4">{parts.join(" → ")}</p>;
}

function StepName({
  nameRu,
  setNameRu,
  slug,
  setSlug,
  onConfirm,
}: {
  nameRu: string;
  setNameRu: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  onConfirm: () => void;
}) {
  const suggestions = useMemo(() => suggestSlugs(nameRu), [nameRu]);
  const [editingCustom, setEditingCustom] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Шаг 2: Название документа</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Напиши название на русском — предложу варианты для <code>utm_medium</code>.
      </p>

      <input
        type="text"
        value={nameRu}
        onChange={(e) => {
          setNameRu(e.target.value);
          setSlug("");
          setEditingCustom(false);
        }}
        placeholder="Например: Скорочтение для детей"
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-4"
      />

      {suggestions.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
            Варианты
          </p>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSlug(s);
                setEditingCustom(false);
              }}
              className={`block w-full text-left border rounded-lg px-4 py-2 text-sm font-mono transition ${
                slug === s
                  ? "border-[var(--accent)] bg-[var(--bg)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setEditingCustom(true)}
        className={`block w-full border rounded-lg px-4 py-2 text-sm text-left transition ${
          editingCustom
            ? "border-[var(--accent)] bg-[var(--bg)]"
            : "border-dashed border-[var(--border)] hover:border-[var(--accent)]"
        }`}
      >
        Свой вариант
      </button>

      {editingCustom && (
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ввести свой slug"
          className="w-full mt-2 border border-[var(--border)] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
        />
      )}

      <button
        onClick={onConfirm}
        disabled={!slug.trim()}
        className="mt-4 bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Дальше →
      </button>
    </div>
  );
}

function StepSite({
  sites,
  customUrl,
  setCustomUrl,
  customTag,
  setCustomTag,
  companySlug,
  onSelect,
  onConfirmCustom,
}: {
  sites: Site[];
  customUrl: string;
  setCustomUrl: (v: string) => void;
  customTag: string;
  setCustomTag: (v: string) => void;
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
      <h2 className="text-xl font-semibold mb-1">Шаг 3: Сайт</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Тег сайта пойдёт в <code>utm_campaign</code>.
      </p>

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
          <li className="px-4 py-3 text-sm text-[var(--text-muted)]">Ничего не найдено</li>
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
        <div className="text-xs text-[var(--text-muted)] mt-1">URL + тег вручную</div>
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
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="тег (utm_campaign)"
            className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <CustomSiteFinishButtons
            url={customUrl}
            tag={customTag}
            companySlug={companySlug}
            disabled={!customUrl.trim() || !customTag.trim()}
            onProceed={onConfirmCustom}
          />
        </div>
      )}
    </div>
  );
}

function StepPlacement({
  placements,
  customPlacement,
  setCustomPlacement,
  onSelect,
  onConfirmCustom,
}: {
  placements: { value: string; display_name: string | null }[];
  customPlacement: string;
  setCustomPlacement: (v: string) => void;
  onSelect: (v: string) => void;
  onConfirmCustom: () => void;
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Шаг 4: Место размещения</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Куда вставляешь UTM в гайде. Пойдёт в <code>utm_content</code>.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {placements.map((p) => (
          <button
            key={p.value}
            onClick={() => onSelect(p.value)}
            className="border border-[var(--border)] rounded-lg px-4 py-3 text-center hover:border-[var(--accent)] hover:bg-[var(--bg)] transition"
          >
            <div className="font-mono text-sm">{p.value}</div>
            {p.display_name && (
              <div className="text-xs text-[var(--text-muted)] mt-1">{p.display_name}</div>
            )}
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
          ввести utm_content вручную
        </div>
      </button>

      {showCustom && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={customPlacement}
            onChange={(e) => setCustomPlacement(e.target.value)}
            placeholder="utm_content"
            className="flex-1 border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
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

function StepDate({
  date,
  setDate,
  onConfirm,
}: {
  date: string;
  setDate: (d: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Шаг 5: Дата первого запуска</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        В <code>utm_term</code> попадёт в формате <code>мм.гг</code>.
      </p>
      <input
        type="month"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-2"
      />
      <p className="text-sm text-[var(--text-muted)] mb-4">
        В метку:{" "}
        <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded">
          {formatMonthDisplay(date)}
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
  slug,
  site,
  placement,
  date,
}: {
  slug: string;
  site: Site;
  placement: string;
  date: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Готовая UTM</h2>
      <EditableUtm
        initial={{
          baseUrl: site.url,
          source: "pdf",
          medium: slug,
          campaign: site.tag,
          content: placement,
          term: formatMonthDisplay(date),
        }}
      />
    </div>
  );
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthDisplay(yyyymm: string): string {
  if (!yyyymm || !yyyymm.includes("-")) return "";
  const [y, m] = yyyymm.split("-");
  return `${m}.${y.slice(2)}`;
}
