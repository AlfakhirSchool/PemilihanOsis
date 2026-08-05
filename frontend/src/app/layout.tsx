import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OSALFA — Pemilihan Ketua OSIS',
  description: 'OSALFA, sistem pencoblosan OSIS digital SD & SMP Islam Modern Al Fakhir',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-800">{children}</body>
    </html>
  );
}
