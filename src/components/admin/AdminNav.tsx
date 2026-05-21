"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Главная", exact: true },
  { href: "/admin/sites", label: "Сайты и теги" },
  { href: "/admin/channels", label: "Каналы" },
  { href: "/admin/placements", label: "Места размещения" },
  { href: "/admin/history", label: "История изменений" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 -mb-px">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm border-b-2 transition ${
              active
                ? "border-[var(--accent)] text-[var(--text)] font-medium"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
