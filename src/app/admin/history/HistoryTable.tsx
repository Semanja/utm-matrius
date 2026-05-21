"use client";

import { useMemo, useState, useTransition } from "react";
import { rollback } from "./actions";

type Entry = {
  id: number;
  table_name: string;
  record_id: number;
  action: string;
  before_json: string | null;
  after_json: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  create: "Создано",
  update: "Изменено",
  delete: "Удалено",
  restore: "Восстановлено",
};

const TABLE_LABELS: Record<string, string> = {
  sites: "Сайты",
  channels: "Каналы",
  placements: "Места",
};

export default function HistoryTable({ entries }: { entries: Entry[] }) {
  const [tableFilter, setTableFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!tableFilter) return entries;
    return entries.filter((e) => e.table_name === tableFilter);
  }, [entries, tableFilter]);

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="">Все таблицы</option>
          <option value="sites">Сайты</option>
          <option value="channels">Каналы</option>
          <option value="placements">Места</option>
        </select>
      </div>

      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Когда</th>
              <th className="text-left px-3 py-2 font-medium">Таблица</th>
              <th className="text-left px-3 py-2 font-medium">Действие</th>
              <th className="text-left px-3 py-2 font-medium">ID записи</th>
              <th className="text-right px-3 py-2 font-medium w-40">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-[var(--text-muted)]"
                >
                  Журнал пуст
                </td>
              </tr>
            )}
            {filtered.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                expanded={expanded === e.id}
                onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: Entry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onRollback() {
    if (!confirm("Откатить это изменение?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await rollback(entry.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      }
    });
  }

  return (
    <>
      <tr
        className="border-b border-[var(--border)] last:border-b-0 cursor-pointer hover:bg-[var(--bg)]"
        onClick={onToggle}
      >
        <td className="px-3 py-2 text-xs text-[var(--text-muted)]">
          {formatDate(entry.created_at)}
        </td>
        <td className="px-3 py-2">
          {TABLE_LABELS[entry.table_name] ?? entry.table_name}
        </td>
        <td className="px-3 py-2">
          <span
            className={`text-xs px-2 py-0.5 rounded ${actionClasses(
              entry.action
            )}`}
          >
            {ACTION_LABELS[entry.action] ?? entry.action}
          </span>
        </td>
        <td className="px-3 py-2 font-mono text-xs">#{entry.record_id}</td>
        <td className="px-3 py-2 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRollback();
            }}
            disabled={pending}
            className="text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)] text-[var(--text-muted)] transition disabled:opacity-50"
          >
            ↺ Откатить
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
          <td colSpan={5} className="px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Json title="Было" json={entry.before_json} />
              <Json title="Стало" json={entry.after_json} />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Json({ title, json }: { title: string; json: string | null }) {
  return (
    <div>
      <p className="text-[var(--text-muted)] mb-1">{title}:</p>
      {json ? (
        <pre className="bg-[var(--surface)] border border-[var(--border)] rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
          {prettyJson(json)}
        </pre>
      ) : (
        <p className="text-[var(--text-muted)] italic">—</p>
      )}
    </div>
  );
}

function prettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

function formatDate(s: string): string {
  // SQLite дата приходит как 'YYYY-MM-DD HH:MM:SS' (UTC)
  const d = new Date(s.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("ru-RU");
}

function actionClasses(action: string): string {
  switch (action) {
    case "create":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "update":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "delete":
      return "bg-red-500/10 text-red-700 dark:text-red-300";
    case "restore":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
    default:
      return "bg-[var(--bg)] text-[var(--text-muted)]";
  }
}
