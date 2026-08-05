import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Link href="/vote" className="rounded-lg bg-teal px-6 py-3 font-semibold text-white">
        Masuk Pemilihan
      </Link>
    </main>
  );
}
