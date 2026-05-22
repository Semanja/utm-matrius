import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UTM-генератор",
  description: "Сборка UTM-меток по правилам Matrius / Zerocoder",
};

// Скрипт ставит data-theme на html ДО рендера body — чтобы не было вспышки.
// Для custom темы дополнительно применяет CSS-переменные из localStorage.
const themeInitScript = `
try {
  var t = localStorage.getItem('utm-gen-theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  if (t === 'custom') {
    var raw = localStorage.getItem('utm-gen-custom-theme');
    if (raw) {
      var c = JSON.parse(raw);
      var el = document.documentElement;
      el.style.setProperty('--bg', c.bg);
      el.style.setProperty('--surface', c.surface);
      el.style.setProperty('--text', c.text);
      el.style.setProperty('--text-muted', c.textMuted);
      el.style.setProperty('--border', c.border);
      el.style.setProperty('--accent', c.accent);
      el.style.setProperty('--accent-hover', c.accentHover);
      el.style.setProperty('--accent-text', c.accentText);
    }
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
