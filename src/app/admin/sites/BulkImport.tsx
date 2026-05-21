"use client";

import { useMemo, useState, useTransition } from "react";
import { bulkImportSites, type BulkRow, type BulkResult } from "./actions";

type ExistingMap = Map<string, string>; // url → tag (только активные)

type Props = {
  existing: ExistingMap;
  onDone: () => void;
  onCancel: () => void;
};

type Parsed = {
  rows: (BulkRow & { status: "new" | "same" | "conflict" | "invalid" })[];
  format: "tsv" | "csv" | "empty";
};

function parseInput(text: string, existing: ExistingMap): Parsed {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { rows: [], format: "empty" };

  // Авто-определение разделителя по первой строке
  const first = lines[0];
  const hasTab = first.includes("\t");
  const hasComma = first.includes(",");
  const format: "tsv" | "csv" = hasTab ? "tsv" : hasComma ? "csv" : "tsv";
  const sep = format === "tsv" ? "\t" : ",";

  const rows: Parsed["rows"] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Если первая строка — заголовок (содержит "url" в первой колонке), пропускаем
    if (
      i === 0 &&
      line.toLowerCase().startsWith("url" + sep)
    ) {
      continue;
    }
    const parts = line.split(sep);
    const url = (parts[0] || "").trim();
    const tag = (parts[1] || "").trim();

    if (!url || !tag) {
      rows.push({ url, tag, status: "invalid" });
      continue;
    }

    const existingTag = existing.get(url);
    if (existingTag === undefined) {
      rows.push({ url, tag, status: "new" });
    } else if (existingTag === tag) {
      rows.push({ url, tag, status: "same" });
    } else {
      rows.push({ url, tag, status: "conflict" });
    }
  }

  return { rows, format };
}

export default function BulkImport({ existing, onCancel, onDone }: Props) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"skip" | "overwrite">("skip");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseInput(text, existing), [text, existing]);
  const counts = useMemo(() => {
    const c = { new: 0, same: 0, conflict: 0, invalid: 0 };
    for (const r of parsed.rows) c[r.status]++;
    return c;
  }, [parsed]);

  function submit() {
    setError(null);
    setResult(null);
    const valid = parsed.rows.filter((r) => r.status !== "invalid");
    if (valid.length === 0) {
      setError("Нет корректных строк для импорта");
      return;
    }
    startTransition(async () => {
      try {
        const res = await bulkImportSites(
          valid.map((r) => ({ url: r.url, tag: r.tag })),
          mode
        );
        setResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      }
    });
  }

  return (
    <div className="border border-[var(--accent)] bg-[var(--surface)] rounded-lg p-4 mb-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-semibold">Массовый импорт сайтов</h3>
        <button
          onClick={onCancel}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ✕ Закрыть
        </button>
      </div>

      <p className="text-sm text-[var(--text-muted)] mb-3">
        Вставь список из двух колонок: <code>URL</code> и <code>тег</code>. Разделитель — таб
        или запятая. Можно копировать прямо из Google Таблиц.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`https://matrius.online/freemaths\tshow-math-flow-1\nhttps://matrius.online/lesson30min\tlesson-flow-1`}
        rows={8}
        className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)] mb-3"
      />

      {parsed.rows.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3 text-sm mb-3">
            <Chip color="emerald" label={`Новые: ${counts.new}`} />
            <Chip color="zinc" label={`Совпадают: ${counts.same}`} />
            <Chip color="amber" label={`Конфликты: ${counts.conflict}`} />
            {counts.invalid > 0 && (
              <Chip color="red" label={`Некорректные: ${counts.invalid}`} />
            )}
            <span className="text-xs text-[var(--text-muted)] self-center">
              Формат: {parsed.format.toUpperCase()}
            </span>
          </div>

          {counts.conflict > 0 && (
            <div className="flex gap-3 items-center mb-3 text-sm">
              <span className="text-[var(--text-muted)]">При конфликтах:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="skip"
                  checked={mode === "skip"}
                  onChange={() => setMode("skip")}
                />
                <span>пропустить</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="overwrite"
                  checked={mode === "overwrite"}
                  onChange={() => setMode("overwrite")}
                />
                <span>перезаписать тег</span>
              </label>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto border border-[var(--border)] rounded mb-3">
            <table className="w-full text-xs">
              <thead className="bg-[var(--bg)] sticky top-0">
                <tr>
                  <th className="text-left px-3 py-1.5 font-medium">URL</th>
                  <th className="text-left px-3 py-1.5 font-medium">Тег</th>
                  <th className="text-left px-3 py-1.5 font-medium w-24">Статус</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-[var(--border)] first:border-t-0"
                  >
                    <td className="px-3 py-1 font-mono break-all">{r.url || <em>пусто</em>}</td>
                    <td className="px-3 py-1 font-mono">{r.tag || <em>пусто</em>}</td>
                    <td className="px-3 py-1">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
      )}

      {result && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 rounded p-3 mb-3 text-sm">
          <p className="font-semibold mb-1">Импорт завершён:</p>
          <ul className="text-xs space-y-0.5">
            <li>Добавлено: {result.created}</li>
            <li>Обновлено: {result.updated}</li>
            <li>Пропущено: {result.skipped}</li>
          </ul>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs">
                Ошибок: {result.errors.length}
              </summary>
              <ul className="text-xs mt-1 text-[var(--text-muted)] space-y-0.5">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
              </ul>
            </details>
          )}
          <button
            onClick={onDone}
            className="mt-3 text-xs bg-[var(--accent)] text-[var(--accent-text)] rounded px-3 py-1.5 font-medium hover:bg-[var(--accent-hover)]"
          >
            Закрыть и вернуться к списку
          </button>
        </div>
      )}

      {!result && (
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={pending || parsed.rows.length === 0}
            className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
          >
            {pending ? "Импортирую…" : "Импортировать"}
          </button>
          <button
            onClick={onCancel}
            className="border border-[var(--border)] text-[var(--text-muted)] rounded px-4 py-2 text-sm hover:text-[var(--text)]"
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "новый", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
    same: { label: "совпадает", cls: "bg-[var(--bg)] text-[var(--text-muted)]" },
    conflict: { label: "конфликт", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
    invalid: { label: "некорректный", cls: "bg-red-500/10 text-red-700 dark:text-red-300" },
  };
  const info = map[status] || { label: status, cls: "" };
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${info.cls}`}>{info.label}</span>
  );
}

function Chip({ color, label }: { color: string; label: string }) {
  const classes: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    red: "bg-red-500/10 text-red-700 dark:text-red-300",
    zinc: "bg-[var(--bg)] text-[var(--text-muted)]",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${classes[color] || ""}`}>
      {label}
    </span>
  );
}
