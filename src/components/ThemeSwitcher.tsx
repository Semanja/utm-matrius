"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "zerocoder" | "matrius";

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
  { value: "zerocoder", label: "Zerocoder" },
  { value: "matrius", label: "Matrius" },
];

const STORAGE_KEY = "utm-gen-theme";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light";
    setTheme(saved);
    setMounted(true);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  if (!mounted) {
    return <div className="h-14" />;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
        Стиль оформления
      </span>
      <div className="flex flex-wrap gap-1 justify-end">
        {THEMES.map((t) => {
          const active = theme === t.value;
          return (
            <button
              key={t.value}
              onClick={() => apply(t.value)}
              className={`text-xs px-2.5 py-1 rounded border transition ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
