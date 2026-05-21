"use client";

import { useState, useTransition } from "react";
import {
  createPlacement,
  updatePlacement,
  deletePlacement,
  restorePlacement,
} from "./actions";

export type PlacementRow = {
  id: number;
  value: string;
  display_name: string | null;
  deleted_at: string | null;
};

type Props = { placements: PlacementRow[] };

export default function PlacementsTable({ placements }: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const visible = placements.filter((p) => showDeleted || !p.deleted_at);

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
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
        <PlacementForm
          mode="create"
          initial={{ value: "", display_name: "" }}
          onDone={() => setCreating(false)}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Значение</th>
              <th className="text-left px-3 py-2 font-medium">Подпись</th>
              <th className="text-right px-3 py-2 font-medium w-40">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-[var(--text-muted)]"
                >
                  Ничего нет
                </td>
              </tr>
            )}
            {visible.map((p) =>
              editingId === p.id ? (
                <EditRow
                  key={p.id}
                  placement={p}
                  onDone={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <ViewRow
                  key={p.id}
                  placement={p}
                  onEdit={() => {
                    setEditingId(p.id);
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
  placement,
  onEdit,
}: {
  placement: PlacementRow;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const deleted = placement.deleted_at !== null;

  function onDelete() {
    if (!confirm(`Удалить «${placement.value}»?`)) return;
    startTransition(async () => {
      await deletePlacement(placement.id);
    });
  }
  function onRestore() {
    startTransition(async () => {
      await restorePlacement(placement.id);
    });
  }

  return (
    <tr
      className={`border-b border-[var(--border)] last:border-b-0 ${
        deleted ? "opacity-50" : ""
      }`}
    >
      <td className="px-3 py-2 font-mono">{placement.value}</td>
      <td className="px-3 py-2 text-[var(--text-muted)]">
        {placement.display_name || "—"}
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
  placement,
  onDone,
  onCancel,
}: {
  placement: PlacementRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
      <td colSpan={3} className="px-4 py-3">
        <PlacementForm
          mode="update"
          id={placement.id}
          initial={{
            value: placement.value,
            display_name: placement.display_name || "",
          }}
          onDone={onDone}
          onCancel={onCancel}
          embedded
        />
      </td>
    </tr>
  );
}

function PlacementForm({
  mode,
  id,
  initial,
  onDone,
  onCancel,
  embedded = false,
}: {
  mode: "create" | "update";
  id?: number;
  initial: { value: string; display_name: string };
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
          await createPlacement(formData);
        } else if (id != null) {
          await updatePlacement(id, formData);
        }
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      }
    });
  }

  return (
    <form
      action={onSubmit}
      className={
        embedded
          ? "flex flex-wrap gap-2 items-start"
          : "border border-[var(--accent)] bg-[var(--surface)] rounded-lg p-4 mb-4 flex flex-wrap gap-2"
      }
    >
      <input
        name="value"
        defaultValue={initial.value}
        placeholder="link-text"
        className="flex-1 min-w-[160px] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
        required
        autoFocus={mode === "create"}
      />
      <input
        name="display_name"
        defaultValue={initial.display_name}
        placeholder="Подпись (необязательно)"
        className="flex-1 min-w-[160px] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
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
      {error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
