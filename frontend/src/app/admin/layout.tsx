import Image from 'next/image';
import Link from 'next/link';

const nav = [
  { href: '/admin/hitung-suara', label: 'Hitung Suara' },
  { href: '/admin/kode', label: 'Kode Pemilih' },
  { href: '/admin/kandidat', label: 'Kandidat' },
  { href: '/admin/hasil', label: 'Hasil' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-1 border-b bg-white px-4 py-2">
        <Image src="/osalfa-logo.png" alt="OSALFA" width={524} height={476} className="mr-3 h-10 w-auto" />
        <span className="mr-3 font-bold text-teal">OSALFA</span>
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
