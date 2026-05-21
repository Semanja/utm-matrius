"use client";

import { useState, useTransition } from "react";
import { saveSiteFromWizard } from "@/lib/wizard-actions";

type Props = {
  url: string;
  tag?: string; // если не передан — извлечём slug из URL на сервере
  companySlug: string;
  disabled?: boolean;
  onProceed: () => void;
};

export default function CustomSiteFinishButtons({
  url,
  tag,
  companySlug,
  disabled,
  onProceed,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function saveAndProceed() {
    setError(null);
    startTransition(async () => {
      const res = await saveSiteFromWizard(url, tag || "", companySlug);
      if (!res.saved) {
        setError(res.reason || "Не удалось сохранить");
        return;
      }
      setSaved(true);
      onProceed();
    });
  }

  function skipAndProceed() {
    onProceed();
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        onClick={saveAndProceed}
        disabled={pending || disabled}
        className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {pending ? "Сохраняю…" : saved ? "✓ Сохранено" : "💾 Сохранить в справочник"}
      </button>
      <button
        type="button"
        onClick={skipAndProceed}
        disabled={pending || disabled}
        className="border border-[var(--border)] text-[var(--text)] rounded px-4 py-2 text-sm font-medium hover:border-[var(--accent)] transition disabled:opacity-50"
      >
        ➡️ Использовать один раз
      </button>
      {error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
