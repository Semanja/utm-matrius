"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка входа");
        setBusy(false);
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Ошибка сети");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg p-6"
      >
        <h1 className="text-2xl font-bold mb-1">Вход в админку</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Введи пароль администратора.
        </p>

        <label className="block text-sm font-medium mb-1">Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] mb-3"
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 border border-red-500/40 bg-red-500/10 rounded px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          className="w-full bg-[var(--accent)] text-[var(--accent-text)] rounded px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
        >
          {busy ? "Проверяю…" : "Войти"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
