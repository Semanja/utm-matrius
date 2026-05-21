"use client";

import { useState } from "react";
import { buildUtm, type UtmParams } from "@/lib/utm";

type FormState = {
  baseUrl: string;
} & UtmParams;

const FIELDS: { key: keyof UtmParams; label: string; placeholder?: string }[] = [
  { key: "source", label: "utm_source", placeholder: "yandex, email, vk..." },
  { key: "medium", label: "utm_medium", placeholder: "cpc, banner, post..." },
  { key: "campaign", label: "utm_campaign", placeholder: "campaign-tag" },
  { key: "content", label: "utm_content" },
  { key: "term", label: "utm_term" },
];

export default function ManualUtmForm() {
  const [form, setForm] = useState<FormState>({
    baseUrl: "",
    source: "",
    medium: "",
    campaign: "",
    content: "",
    term: "",
  });
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
    setCopied(false);
  }

  function submit() {
    setError(null);
    if (!form.baseUrl.trim()) {
      setError("Введи базовый URL");
      return;
    }
    try {
      const url = buildUtm(form.baseUrl, form);
      setResult(url);
    } catch {
      setError("Некорректный URL. Должен начинаться с https:// или http://");
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">
          Базовый URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={form.baseUrl}
          onChange={(e) => update("baseUrl", e.target.value)}
          placeholder="https://matrius.online/page"
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium mb-1">{f.label}</label>
          <input
            type="text"
            value={form[f.key] ?? ""}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 border border-red-500/40 bg-red-500/10 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        className="w-full bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] transition"
      >
        Собрать UTM
      </button>

      {result && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 rounded-lg p-4 mt-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-2 font-medium">
            Готовая ссылка:
          </p>
          <p className="break-all text-sm font-mono mb-3 select-all">
            {result}
          </p>
          <button
            onClick={copyResult}
            className="text-xs bg-emerald-600 text-white rounded px-3 py-1.5 hover:bg-emerald-700 transition"
          >
            {copied ? "✓ Скопировано" : "📋 Скопировать"}
          </button>
        </div>
      )}
    </div>
  );
}
