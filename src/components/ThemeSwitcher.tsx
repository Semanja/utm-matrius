"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "zerocoder" | "matrius" | "custom";

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
  { value: "zerocoder", label: "Zerocoder" },
  { value: "matrius", label: "Matrius" },
  { value: "custom", label: "Своя" },
];

const STORAGE_KEY = "utm-gen-theme";
const CUSTOM_KEY = "utm-gen-custom-theme";

type CustomColors = {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentHover: string;
  accentText: string;
};

const DEFAULT_CUSTOM: CustomColors = {
  bg: "#F7F5FB",
  surface: "#FFFFFF",
  text: "#1F1B2E",
  textMuted: "#6B6580",
  border: "#E6E2EF",
  accent: "#5B3FBF",
  accentHover: "#7A5FD9",
  accentText: "#FFFFFF",
};

const COLOR_FIELDS: {
  key: keyof CustomColors;
  label: string;
  hint: string;
}[] = [
  { key: "bg", label: "Фон страницы", hint: "Основной фон всех экранов" },
  { key: "surface", label: "Карточки и поверхности", hint: "Фон кнопок-карточек, форм, попапов" },
  { key: "text", label: "Основной текст", hint: "Цвет заголовков и обычного текста" },
  { key: "textMuted", label: "Приглушённый текст", hint: "Подписи, подсказки, second-info" },
  { key: "border", label: "Бордеры и разделители", hint: "Линии вокруг кнопок и блоков" },
  { key: "accent", label: "Акцент (кнопки, активные)", hint: "Цвет CTA-кнопок и подсветки выбора" },
  { key: "accentHover", label: "Hover-вариант акцента", hint: "Цвет при наведении на кнопки" },
  { key: "accentText", label: "Текст на акценте", hint: "Цвет текста внутри цветных кнопок" },
];

function applyCustomColors(colors: CustomColors) {
  const el = document.documentElement;
  el.style.setProperty("--bg", colors.bg);
  el.style.setProperty("--surface", colors.surface);
  el.style.setProperty("--text", colors.text);
  el.style.setProperty("--text-muted", colors.textMuted);
  el.style.setProperty("--border", colors.border);
  el.style.setProperty("--accent", colors.accent);
  el.style.setProperty("--accent-hover", colors.accentHover);
  el.style.setProperty("--accent-text", colors.accentText);
}

function clearCustomColors() {
  const el = document.documentElement;
  el.style.removeProperty("--bg");
  el.style.removeProperty("--surface");
  el.style.removeProperty("--text");
  el.style.removeProperty("--text-muted");
  el.style.removeProperty("--border");
  el.style.removeProperty("--accent");
  el.style.removeProperty("--accent-hover");
  el.style.removeProperty("--accent-text");
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors>(DEFAULT_CUSTOM);

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light";
    setTheme(saved);
    const customRaw = localStorage.getItem(CUSTOM_KEY);
    if (customRaw) {
      try {
        const parsed = JSON.parse(customRaw) as CustomColors;
        setCustomColors(parsed);
        if (saved === "custom") applyCustomColors(parsed);
      } catch {
        // ignore
      }
    }
    setMounted(true);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEY, t);
    if (t === "custom") {
      applyCustomColors(customColors);
    } else {
      clearCustomColors();
    }
    if (t === "custom") setEditorOpen(true);
  }

  function updateColor(key: keyof CustomColors, value: string) {
    const next = { ...customColors, [key]: value };
    setCustomColors(next);
    applyCustomColors(next);
  }

  function saveCustom() {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customColors));
    setEditorOpen(false);
  }

  function resetCustom() {
    setCustomColors(DEFAULT_CUSTOM);
    applyCustomColors(DEFAULT_CUSTOM);
  }

  if (!mounted) {
    return <div className="h-14" />;
  }

  return (
    <div className="flex flex-col items-end gap-1.5 relative">
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
        {theme === "custom" && (
          <button
            onClick={() => setEditorOpen((v) => !v)}
            className="text-xs px-2.5 py-1 rounded border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] transition"
            title="Открыть редактор цветов"
          >
            🎨
          </button>
        )}
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-end p-4 sm:p-8 bg-black/30">
          <div
            className="w-full max-w-md max-h-full overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">Свой стиль</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Изменения видны сразу. «Сохранить» — запомнит в этом браузере.
                </p>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] ml-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {COLOR_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColors[f.key]}
                    onChange={(e) => updateColor(f.key, e.target.value)}
                    className="w-10 h-10 rounded border border-[var(--border)] cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-xs text-[var(--text-muted)]">{f.hint}</div>
                  </div>
                  <input
                    type="text"
                    value={customColors[f.key]}
                    onChange={(e) => updateColor(f.key, e.target.value)}
                    className="w-20 text-xs font-mono border border-[var(--border)] rounded px-2 py-1 text-[var(--text)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={saveCustom}
                className="bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)]"
              >
                💾 Сохранить
              </button>
              <button
                onClick={resetCustom}
                className="border border-[var(--border)] text-[var(--text-muted)] rounded px-4 py-2 text-sm hover:text-[var(--text)]"
              >
                ↺ Сбросить к дефолту
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
