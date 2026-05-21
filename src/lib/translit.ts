const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => (MAP[ch] !== undefined ? MAP[ch] : ch))
    .join("");
}

// Несколько вариантов слага из русской фразы
export function suggestSlugs(input: string): string[] {
  const raw = input.trim();
  if (!raw) return [];

  const lower = raw.toLowerCase();
  const tr = transliterate(lower);

  // Чистим от лишних символов, оставляем только буквы/цифры/пробелы/дефисы/подчёркивания
  const clean = (s: string) =>
    s.replace(/[^a-z0-9а-яё\s\-_]/gi, " ").replace(/\s+/g, " ").trim();

  const trClean = clean(tr);
  const lowerClean = clean(lower);

  const variants = new Set<string>();
  // 1. транслит с дефисами
  variants.add(trClean.replace(/[\s_]+/g, "-"));
  // 2. транслит без разделителей
  variants.add(trClean.replace(/[\s_-]+/g, ""));
  // 3. транслит с подчёркиваниями
  variants.add(trClean.replace(/[\s-]+/g, "_"));
  // 4. оригинал (кириллица) с дефисами
  variants.add(lowerClean.replace(/[\s_]+/g, "-"));

  return Array.from(variants).filter((s) => s.length > 0);
}
