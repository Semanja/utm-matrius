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

type AdsStep = "person" | "channel" | "site" | "result";

const OTHER = "other";

export default function BranchAds({
  channels,
  sites,
  companySlug,
  onBack,
  onReset,
}: Props) {
  const [step, setStep] = useState<AdsStep>("person");

  const [person, setPerson] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [manualMedium, setManualMedium] = useState<string>("");
  const [site, setSite] = useState<Site | null>(null);
  const [customUrl, setCustomUrl] = useState<string>("");
  const [customTag, setCustomTag] = useState<string>("");

  const adsChannels = useMemo(
    () => channels.filter((c) => c.branch === "ads"),
    [channels]
  );

  const people = useMemo(() => {
    const set = new Set<string>();
    for (const c of adsChannels) {
      if (c.group_name && c.group_name !== OTHER) set.add(c.group_name);
    }
    return Array.from(set);
  }, [adsChannels]);

  const otherChannels = useMemo(
    () => adsChannels.filter((c) => c.group_name === OTHER),
    [adsChannels]
  );

  const channelsForPerson = useMemo(() => {
    if (!person) return [];
    return adsChannels.filter((c) => c.group_name === person);
  }, [adsChannels, person]);

  function selectPerson(p: string) {
    setPerson(p);
    if (p === OTHER) {
      setStep("channel");
      return;
    }
    const personChannels = adsChannels.filter((c) => c.group_name === p);
    if (personChannels.length === 1) {
      setChannel(personChannels[0]);
      // Если канал ещё требует ручной medium — остаёмся на channel-шаге
      if (personChannels[0].needs_manual_medium) {
        setStep("channel");
      } else {
        setStep("site");
      }
    } else {
      setStep("channel");
    }
  }

  function selectChannel(c: Channel) {
    setChannel(c);
    if (c.needs_manual_medium) {
      // Остаёмся на текущем шаге — UI покажет инпут под выбранным каналом
      return;
    }
    setStep("site");
  }

  function confirmManualMedium() {
    if (!manualMedium.trim()) return;
    setStep("site");
  }

  function selectSite(s: Site) {
    setSite(s);
    setStep("result");
  }

  function confirmCustomSite() {
    if (!customUrl.trim()) return;
    setSite({
      id: -1,
      url: customUrl.trim(),
      tag: customTag.trim(),
    });
    setStep("result");
  }

  function backStep() {
    if (step === "channel") {
      setChannel(null);
      setManualMedium("");
      setStep("person");
    } else if (step === "site") {
      setSite(null);
      const personChannels = person
        ? adsChannels.filter((c) => c.group_name === person)
        : [];
      // Если канал был выбран автоматом — назад к «кто настраивает»
      if (person !== OTHER && personChannels.length === 1 && !personChannels[0].needs_manual_medium) {
        setChannel(null);
        setStep("person");
      } else {
        setStep("channel");
      }
    } else if (step === "result") {
      setStep("site");
    }
  }

  return (
    <section>
      <AdsBreadcrumbs
        person={person}
        channel={channel}
        site={site}
        step={step}
      />

      {step === "person" && (
        <StepPerson people={people} onSelect={selectPerson} />
      )}

      {step === "channel" && person && (
        <StepChannel
          person={person}
          personChannels={channelsForPerson}
          otherChannels={otherChannels}
          selectedChannel={channel}
          manualMedium={manualMedium}
          setManualMedium={setManualMedium}
          onSelect={selectChannel}
          onConfirmManualMedium={confirmManualMedium}
        />
      )}

      {step === "site" && channel && (
        <StepSite
          channel={channel}
          manualMedium={manualMedium}
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

      {step === "result" && channel && site && (
        <StepResult
          channel={channel}
          manualMedium={manualMedium}
          site={site}
        />
      )}

      <div className="flex gap-4 mt-6">
        {step !== "person" && (
          <button
            onClick={backStep}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            ← назад
          </button>
        )}
        <button
          onClick={step === "person" ? onBack : onReset}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          {step === "person" ? "← к типу задачи" : "↺ начать заново"}
        </button>
      </div>
    </section>
  );
}

function AdsBreadcrumbs({
  person,
  channel,
  site,
  step,
}: {
  person: string | null;
  channel: Channel | null;
  site: Site | null;
  step: AdsStep;
}) {
  const parts: string[] = ["Реклама"];
  if (person) parts.push(person === OTHER ? "Другое" : person);
  if (channel) parts.push(channel.display_name);
  if (site && step === "result") {
    const short = site.url.replace("https://", "").replace("http://", "");
    parts.push(short.length > 30 ? short.slice(0, 30) + "…" : short);
  }
  return <p className="text-sm text-[var(--text-muted)] mb-4">{parts.join(" → ")}</p>;
}

function StepPerson({
  people,
  onSelect,
}: {
  people: string[];
  onSelect: (p: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Шаг 2: Кто настраивает</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {people.map((p) => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className="border border-[var(--border)] rounded-lg px-5 py-4 text-left hover:border-[var(--accent)] hover:bg-[var(--bg)] transition"
          >
            <div className="font-semibold">{p}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onSelect(OTHER)}
        className="block w-full border border-dashed border-[var(--border)] rounded-lg px-5 py-4 text-left hover:border-[var(--accent)] transition"
      >
        <div className="font-semibold">Другое</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">
          внешние сервисы: RIS, Flocktory, Centrium, автообзвон, Avito и т.д.
        </div>
      </button>
    </div>
  );
}

function StepChannel({
  person,
  personChannels,
  otherChannels,
  selectedChannel,
  manualMedium,
  setManualMedium,
  onSelect,
  onConfirmManualMedium,
}: {
  person: string;
  personChannels: Channel[];
  otherChannels: Channel[];
  selectedChannel: Channel | null;
  manualMedium: string;
  setManualMedium: (v: string) => void;
  onSelect: (c: Channel) => void;
  onConfirmManualMedium: () => void;
}) {
  const isOther = person === OTHER;
  const channels = isOther ? otherChannels : personChannels;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Шаг 3: Канал</h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        {isOther ? "Внешний сервис" : `Человек: ${person}`}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {channels.map((c) => {
          const isSelected = selectedChannel?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`border rounded-lg px-5 py-4 text-left transition ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--bg)]"
                  : "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg)]"
              }`}
            >
              <div className="font-semibold">{c.display_name}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                {c.utm_source}
                {c.utm_medium ? ` / ${c.utm_medium}${c.needs_url_slug ? "{хвост}" : ""}` : ""}
                {c.needs_manual_medium ? " / ?" : ""}
              </div>
            </button>
          );
        })}
      </div>

      {selectedChannel?.needs_manual_medium && (
        <div className="mt-4 border border-[var(--border)] rounded-lg p-4 bg-[var(--bg)]">
          <p className="text-sm font-medium mb-2">
            Введи <code>utm_medium</code> для {selectedChannel.display_name}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualMedium}
              onChange={(e) => setManualMedium(e.target.value)}
              placeholder="utm_medium"
              className="flex-1 border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={onConfirmManualMedium}
              className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)]"
            >
              Дальше →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepSite({
  channel,
  manualMedium,
  sites,
  customUrl,
  setCustomUrl,
  customTag,
  setCustomTag,
  companySlug,
  onSelect,
  onConfirmCustom,
}: {
  channel: Channel;
  manualMedium: string;
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

  const usesUrlSlug = isYandexArtem(channel);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return sites;
    return sites.filter(
      (s) => s.url.toLowerCase().includes(f) || s.tag.toLowerCase().includes(f)
    );
  }, [sites, filter]);

  // Превью канала с подставленным medium
  const mediumPreview = channel.needs_manual_medium
    ? manualMedium || "?"
    : channel.utm_medium ?? "";

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Шаг 4: Сайт</h2>
      <p className="text-sm text-[var(--text-muted)] mb-1 font-mono">
        {channel.utm_source} / {mediumPreview}
        {channel.needs_url_slug ? "{хвост}" : ""}
      </p>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        {usesUrlSlug
          ? "Для этого канала в utm_campaign пойдёт хвост URL."
          : "Тег сайта пойдёт в utm_campaign."}
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
        <div className="text-xs text-[var(--text-muted)] mt-1">
          URL{!usesUrlSlug ? " + тег" : ""} вручную
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
          {!usesUrlSlug && (
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="тег (utm_campaign)"
              className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          )}
          <CustomSiteFinishButtons
            url={customUrl}
            tag={usesUrlSlug ? "" : customTag}
            companySlug={companySlug}
            disabled={!customUrl.trim() || (!usesUrlSlug && !customTag.trim())}
            onProceed={onConfirmCustom}
          />
        </div>
      )}
    </div>
  );
}

function StepResult({
  channel,
  manualMedium,
  site,
}: {
  channel: Channel;
  manualMedium: string;
  site: Site;
}) {
  // Собираем medium: либо ручной, либо template + slug, либо как есть
  let medium = "";
  if (channel.needs_manual_medium) {
    medium = manualMedium;
  } else if (channel.needs_url_slug) {
    medium = `${channel.utm_medium ?? ""}${extractUrlSlug(site.url)}`;
  } else {
    medium = channel.utm_medium ?? "";
  }

  // Кампания: хвост URL для Артёма-Я.Директа, иначе тег сайта
  const campaign = isYandexArtem(channel) ? extractUrlSlug(site.url) : site.tag;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Готовая UTM</h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        <code>utm_content</code> и <code>utm_term</code> для рекламы — на своё
        усмотрение. Заполни через «✏️ Редактировать вручную» если нужно.
      </p>

      <EditableUtm
        initial={{
          baseUrl: site.url,
          source: channel.utm_source,
          medium,
          campaign,
          content: "",
          term: "",
        }}
      />
    </div>
  );
}

function isYandexArtem(c: Channel): boolean {
  return (
    c.branch === "ads" &&
    c.utm_source === "yandex" &&
    c.utm_medium === "artem"
  );
}
