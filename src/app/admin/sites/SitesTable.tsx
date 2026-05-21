"use client";

import { useMemo, useState, useTransition } from "react";
import { createSite, updateSite, deleteSite, restoreSite } from "./actions";

type SiteRow = {
  id: number;
  url: string;
  tag: string;
  deleted_at: string | null;
};

type Props = {
  sites: SiteRow[];
};

export default function SitesTable({ sites }: Props) {
  const [filter, setFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return sites.filter((s) => {
      if (s.deleted_at && !showDeleted) return false;
      if (!f) return true;
      return (
        s.url.toLowerCase().includes(f) || s.tag.toLowerCase().includes(f)
      );
    });
  }, [sites, filter, showDeleted]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Поиск по URL или тегу..."
          className="flex-1 min-w-[200px] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <label className="text-sm text-[var(--text-muted)] flex items-center gap-2">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          показать удалённые
        </label>
        <button
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] transition"
        >
          + Добавить
        </button>
      </div>

      {creating && (
        <CreateForm
          onDone={() => setCreating(false)}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
            <tr>
              <th className="text-left px-4 py-2 font-medium">URL</th>
              <th className="text-left px-4 py-2 font-medium">Тег</th>
              <th className="text-right px-4 py-2 font-medium w-48">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-[var(--text-muted)]"
                >
                  {sites.length === 0
                    ? "Сайтов пока нет — добавь первый"
                    : "Ничего не найдено по фильтру"}
                </td>
              </tr>
            )}
            {filtered.map((s) =>
              editingId === s.id ? (
                <EditRow
                  key={s.id}
                  site={s}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <ViewRow
                  key={s.id}
                  site={s}
                  onEdit={() => {
                    setEditingId(s.id);
                    setCreating(false);
                  }}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ViewRow({
  site,
  onEdit,
}: {
  site: SiteRow;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const deleted = site.deleted_at !== null;

  function onDelete() {
    if (!confirm(`Удалить ${site.url}?`)) return;
    startTransition(async () => {
      await deleteSite(site.id);
    });
  }
  function onRestore() {
    startTransition(async () => {
      await restoreSite(site.id);
    });
  }

  return (
    <tr
      className={`border-b border-[var(--border)] last:border-b-0 ${
        deleted ? "opacity-50" : ""
      }`}
    >
      <td className="px-4 py-2 break-all">{site.url}</td>
      <td className="px-4 py-2">
        <code className="text-xs bg-[var(--bg)] px-2 py-0.5 rounded">
          {site.tag}
        </code>
      </td>
      <td className="px-4 py-2 text-right">
        {deleted ? (
          <button
            onClick={onRestore}
            disabled={pending}
            className="text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)] text-[var(--text-muted)] transition disabled:opacity-50"
          >
            Восстановить
          </button>
        ) : (
          <div className="flex gap-1 justify-end">
            <button
              onClick={onEdit}
              className="text-xs px-2.5 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)] text-[var(--text-muted)] transition"
            >
              Изменить
            </button>
            <button
              onClick={onDelete}
              disabled={pending}
              className="text-xs px-2.5 py-1 rounded border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
            >
              Удалить
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function EditRow({
  site,
  onDone,
  onCancel,
}: {
  site: SiteRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateSite(site.id, formData);
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      }
    });
  }

  return (
    <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
      <td colSpan={3} className="px-4 py-3">
        <form action={onSubmit} className="flex flex-wrap gap-2 items-start">
          <input
            name="url"
            defaultValue={site.url}
            placeholder="URL"
            className="flex-1 min-w-[200px] border border-[var(--border)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            required
          />
          <input
            name="tag"
            defaultValue={site.tag}
            placeholder="тег"
            className="w-40 border border-[var(--border)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="text-xs bg-[var(--accent)] text-[var(--accent-text)] rounded px-3 py-1.5 font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs border border-[var(--border)] text-[var(--text-muted)] rounded px-3 py-1.5 hover:text-[var(--text)]"
          >
            Отмена
          </button>
          {error && (
            <p className="w-full text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </form>
      </td>
    </tr>
  );
}

function CreateForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createSite(formData);
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      }
    });
  }

  return (
    <form
      action={onSubmit}
      className="border border-[var(--accent)] bg-[var(--surface)] rounded-lg p-4 mb-4"
    >
      <h3 className="font-semibold mb-3">Новый сайт</h3>
      <div className="flex flex-wrap gap-2">
        <input
          name="url"
          placeholder="https://..."
          className="flex-1 min-w-[200px] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          required
          autoFocus
        />
        <input
          name="tag"
          placeholder="тег (utm_campaign)"
          className="w-48 border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-[var(--border)] text-[var(--text-muted)] rounded px-4 py-2 text-sm hover:text-[var(--text)]"
        >
          Отмена
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
