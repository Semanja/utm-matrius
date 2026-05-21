"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Company } from "@/db/queries";

type Props = {
  companies: Company[];
  current: string;
};

export default function CompanySwitcher({ companies, current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function setCompany(slug: string) {
    await fetch("/api/admin/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-1">
      {companies.map((c) => {
        const active = c.slug === current;
        return (
          <button
            key={c.slug}
            onClick={() => setCompany(c.slug)}
            disabled={pending}
            className={`text-xs px-2.5 py-1 rounded border transition ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
