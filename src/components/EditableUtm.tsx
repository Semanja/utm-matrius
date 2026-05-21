"use client";

import { useMemo, useState } from "react";

export type UtmFields = {
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
};

type Props = {
  initial: UtmFields;
};

export default function EditableUtm({ initial }: Props) {
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<UtmFields>(initial);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => assembleUrl(fields), [fields]);

  function update<K extends keyof UtmFields>(key: K, value: UtmFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
    setCopied(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setFields(initial);
    setEditing(false);
  }

  return (
    <div className="border border-emerald-500/40 bg-emerald-500/10 rounded-lg p-4">
      {editing ? (
        <EditableChain fields={fields} onChange={update} />
      ) : (
        <p className="break-all text-sm font-mono mb-3 select-all">{url}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={copy}
          className="text-xs bg-emerald-600 text-white rounded px-3 py-1.5 hover:bg-emerald-700 transition"
        >
          {copied ? "✓ Скопировано" : "📋 Скопировать"}
        </button>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs bg-[var(--surface)] border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 rounded px-3 py-1.5 hover:bg-emerald-500/10 transition"
          >
            ✏️ Редактировать вручную
          </button>
        ) : (
          <button
            onClick={reset}
            className="text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded px-3 py-1.5 hover:bg-[var(--bg)] transition"
          >
            ↺ Вернуть как было
          </button>
        )}
      </div>
    </div>
  );
}

function EditableChain({
  fields,
  onChange,
}: {
  fields: UtmFields;
  onChange: <K extends keyof UtmFields>(key: K, value: UtmFields[K]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-y-2 font-mono text-sm leading-7">
      <AutoInput
        value={fields.baseUrl}
        onChange={(v) => onChange("baseUrl", v)}
        ariaLabel="Базовый URL"
      />
      <Sep>{"?utm_source="}</Sep>
      <AutoInput
        value={fields.source}
        onChange={(v) => onChange("source", v)}
        ariaLabel="utm_source"
      />
      <Sep>{"&utm_medium="}</Sep>
      <AutoInput
        value={fields.medium}
        onChange={(v) => onChange("medium", v)}
        ariaLabel="utm_medium"
      />
      <Sep>{"&utm_campaign="}</Sep>
      <AutoInput
        value={fields.campaign}
        onChange={(v) => onChange("campaign", v)}
        ariaLabel="utm_campaign"
      />
      <Sep>{"&utm_content="}</Sep>
      <AutoInput
        value={fields.content}
        onChange={(v) => onChange("content", v)}
        ariaLabel="utm_content"
      />
      <Sep>{"&utm_term="}</Sep>
      <AutoInput
        value={fields.term}
        onChange={(v) => onChange("term", v)}
        ariaLabel="utm_term"
      />
    </div>
  );
}

function Sep({ children }: { children: string }) {
  return <span className="text-[var(--text-muted)] select-all">{children}</span>;
}

function AutoInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  // Ширина инпута подстраивается под содержимое
  const width = Math.max(value.length, 3) + "ch";
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      style={{ width }}
      className="bg-[var(--surface)] border border-emerald-500/40 rounded px-1.5 py-0.5 text-[var(--text)] focus:outline-none focus:border-emerald-500"
    />
  );
}

function assembleUrl(fields: UtmFields): string {
  // Собираем URL вручную, чтобы в режиме редактирования юзер мог писать что угодно
  // (даже невалидный URL — отображаем как есть)
  const parts: string[] = [];
  const add = (key: string, value: string) => {
    if (value && value.trim() !== "") {
      parts.push(`${key}=${encodeURIComponent(value)}`);
    }
  };
  add("utm_source", fields.source);
  add("utm_medium", fields.medium);
  add("utm_campaign", fields.campaign);
  add("utm_content", fields.content);
  add("utm_term", fields.term);

  const base = fields.baseUrl || "";
  if (parts.length === 0) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${parts.join("&")}`;
}
