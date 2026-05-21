"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createChannel,
  updateChannel,
  deleteChannel,
  restoreChannel,
} from "./actions";

export type ChannelRow = {
  id: number;
  branch: string;
  group_name: string | null;
  display_name: string;
  utm_source: string;
  utm_medium: string | null;
  needs_url_slug: boolean;
  needs_manual_medium: boolean;
  deleted_at: string | null;
};

const BRANCHES: { value: string; label: string }[] = [
  { value: "announce", label: "Анонс" },
  { value: "smm", label: "СММ" },
  { value: "ads", label: "Реклама" },
  { value: "guide", label: "Гайд" },
];

const BRANCH_LABELS: Record<string, string> = Object.fromEntries(
  BRANCHES.map((b) => [b.value, b.label])
);

type Props = { channels: ChannelRow[] };

export default function ChannelsTable({ channels }: Props) {
  const [filter, setFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return channels.filter((c) => {
      if (c.deleted_at && !showDeleted) return false;
      if (branchFilter && c.branch !== branchFilter) return false;
      if (!f) return true;
      return (
        c.display_name.toLowerCase().includes(f) ||
        c.utm_source.toLowerCase().includes(f) ||
        (c.utm_medium || "").toLowerCase().includes(f) ||
        (c.group_name || "").toLowerCase().includes(f)
      );
    });
  }, [channels, filter, branchFilter, showDeleted]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Поиск..."
          className="flex-1 min-w-[160px] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="">Все ветки</option>
          {BRANCHES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <label className="text-sm text-[var(--text-muted)] flex items-center gap-2">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          удалённые
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
        <ChannelForm
          mode="create"
          initial={{
            branch: branchFilter || "announce",
            group_name: "",
            display_name: "",
            utm_source: "",
            utm_medium: "",
            needs_url_slug: false,
            needs_manual_medium: false,
          }}
          onCancel={() => setCreating(false)}
          onDone={() => setCreating(false)}
        />
      )}

      <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Ветка</th>
              <th className="text-left px-3 py-2 font-medium">Группа</th>
              <th className="text-left px-3 py-2 font-medium">Канал</th>
              <th className="text-left px-3 py-2 font-medium">source</th>
              <th className="text-left px-3 py-2 font-medium">medium</th>
              <th className="text-left px-3 py-2 font-medium">Флаги</th>
              <th className="text-right px-3 py-2 font-medium w-40">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-[var(--text-muted)]"
                >
                  Ничего нет
                </td>
              </tr>
            )}
            {filtered.map((c) =>
              editingId === c.id ? (
                <EditRow
                  key={c.id}
                  channel={c}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <ViewRow
                  key={c.id}
                  channel={c}
                  onEdit={() => {
                    setEditingId(c.id);
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
  channel,
  onEdit,
}: {
  channel: ChannelRow;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const deleted = channel.deleted_at !== null;

  function onDelete() {
    if (!confirm(`Удалить «${channel.display_name}»?`)) return;
    startTransition(async () => {
      await deleteChannel(channel.id);
    });
  }
  function onRestore() {
    startTransition(async () => {
      await restoreChannel(channel.id);
    });
  }

  return (
    <tr
      className={`border-b border-[var(--border)] last:border-b-0 ${
        deleted ? "opacity-50" : ""
      }`}
    >
      <td className="px-3 py-2">{BRANCH_LABELS[channel.branch] ?? channel.branch}</td>
      <td className="px-3 py-2">{channel.group_name || "—"}</td>
      <td className="px-3 py-2 font-medium">{channel.display_name}</td>
      <td className="px-3 py-2 font-mono text-xs">{channel.utm_source}</td>
      <td className="px-3 py-2 font-mono text-xs">
        {channel.utm_medium ?? "—"}
        {channel.needs_url_slug && <span className="text-[var(--text-muted)]">{"{slug}"}</span>}
      </td>
      <td className="px-3 py-2 text-xs text-[var(--text-muted)]">
        {channel.needs_url_slug && <span>slug </span>}
        {channel.needs_manual_medium && <span>manual </span>}
        {!channel.needs_url_slug && !channel.needs_manual_medium && "—"}
      </td>
      <td className="px-3 py-2 text-right">
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
  channel,
  onDone,
  onCancel,
}: {
  channel: ChannelRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
      <td colSpan={7} className="px-4 py-3">
        <ChannelForm
          mode="update"
          initial={{
            branch: channel.branch,
            group_name: channel.group_name || "",
            display_name: channel.display_name,
            utm_source: channel.utm_source,
            utm_medium: channel.utm_medium || "",
            needs_url_slug: channel.needs_url_slug,
            needs_manual_medium: channel.needs_manual_medium,
          }}
          id={channel.id}
          onDone={onDone}
          onCancel={onCancel}
          embedded
        />
      </td>
    </tr>
  );
}

type FormState = {
  branch: string;
  group_name: string;
  display_name: string;
  utm_source: string;
  utm_medium: string;
  needs_url_slug: boolean;
  needs_manual_medium: boolean;
};

function ChannelForm({
  mode,
  initial,
  id,
  onDone,
  onCancel,
  embedded = false,
}: {
  mode: "create" | "update";
  initial: FormState;
  id?: number;
  onDone: () => void;
  onCancel: () => void;
  embedded?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createChannel(formData);
        } else if (id != null) {
          await updateChannel(id, formData);
        }
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      }
    });
  }

  const wrapper = embedded
    ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
    : "border border-[var(--accent)] bg-[var(--surface)] rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3";

  return (
    <form action={onSubmit} className={wrapper}>
      {!embedded && (
        <h3 className="font-semibold sm:col-span-2">Новый канал</h3>
      )}
      <Field label="Ветка">
        <select
          name="branch"
          defaultValue={initial.branch}
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
          required
        >
          {BRANCHES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Группа (платформа / человек / other)">
        <input
          name="group_name"
          defaultValue={initial.group_name}
          placeholder="email / Артём / other / (пусто)"
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
      </Field>
      <Field label="Название канала">
        <input
          name="display_name"
          defaultValue={initial.display_name}
          placeholder="Unisender / VK-ads / ..."
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          required
        />
      </Field>
      <Field label="utm_source">
        <input
          name="utm_source"
          defaultValue={initial.utm_source}
          placeholder="email / vk-ads / ..."
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] font-mono"
          required
        />
      </Field>
      <Field label="utm_medium (необязательно)">
        <input
          name="utm_medium"
          defaultValue={initial.utm_medium}
          placeholder="unisender / artem / ilya_"
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] font-mono"
        />
      </Field>
      <div className="sm:col-span-1 flex flex-col gap-2 justify-end">
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            name="needs_url_slug"
            defaultChecked={initial.needs_url_slug}
          />
          <span>
            к utm_medium добавляется <code className="text-xs">{"{хвост URL}"}</code>
          </span>
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            name="needs_manual_medium"
            defaultChecked={initial.needs_manual_medium}
          />
          <span>utm_medium вводится вручную в мастере</span>
        </label>
      </div>

      <div className="sm:col-span-2 flex gap-2 mt-2">
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
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 ml-2 self-center">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
