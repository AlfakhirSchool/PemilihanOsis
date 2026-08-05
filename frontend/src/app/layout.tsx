import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pemilihan OSIS — Al Fakhir',
  description: 'Sistem pencoblosan OSIS digital SD & SMP Islam Modern Al Fakhir',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-800">{children}</body>
    </html>
  );
}
