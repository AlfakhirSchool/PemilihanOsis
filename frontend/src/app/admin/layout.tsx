import Link from 'next/link';

const nav = [
  { href: '/admin/hitung-suara', label: 'Hitung Suara' },
  { href: '/admin/kandidat', label: 'Kandidat' },
  { href: '/admin/periode', label: 'Periode' },
  { href: '/admin/hasil', label: 'Hasil' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="flex gap-1 border-b bg-white px-4 py-2">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="p-6">{children}</div>
    </div>
  );
}
