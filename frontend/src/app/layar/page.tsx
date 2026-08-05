'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

interface Candidate {
  candidate_id: string;
  nomor_urut: number;
  nama_ketua: string;
  nama_wakil: string | null;
  jumlah_suara: number;
}
interface Results {
  title: string | null;
  status: string | null;
  total_siswa: number;
  total_masuk: number;
  candidates: Candidate[];
}

const BAR_COLORS = ['#125E63', '#FAC760', '#0E464A', '#DA9407', '#5C4A1E'];
const POLL_MS = 4000;

// Halaman publik, tanpa login — dipasang di layar proyektor saat penghitungan suara.
// Cari election aktif sendiri, lalu poll hasil tiap POLL_MS. Cuma agregat (suara sudah
// direveal admin), tidak ada data per-siswa.
export default function LayarPage() {
  const [electionId, setElectionId] = useState<string | null>(null);
  const [data, setData] = useState<Results | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.publicActiveId().then((r) => setElectionId(r.election_id));
  }, []);

  useEffect(() => {
    if (!electionId) return;
    const poll = () => api.publicResults(electionId).then(setData).catch(() => {});
    poll();
    timer.current = setInterval(poll, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [electionId]);

  if (!electionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-300">
        Belum ada pemilihan yang aktif.
      </div>
    );
  }

  const maxCount = Math.max(1, ...(data?.candidates.map((c) => c.jumlah_suara) ?? [0]));
  const leaderId = data?.candidates.slice().sort((a, b) => b.jumlah_suara - a.jumlah_suara)[0]?.candidate_id;
  const totalRevealed = data?.candidates.reduce((s, c) => s + c.jumlah_suara, 0) ?? 0;

  return (
    <div className="min-h-screen bg-slate-900 px-10 py-8 text-white">
      <div className="mb-10 flex items-center justify-center gap-4">
        <Image src="/osalfa-logo.png" alt="OSALFA" width={72} height={72} />
        <div>
          <h1 className="text-3xl font-bold text-gold">{data?.title ?? 'OSALFA'}</h1>
          <p className="text-slate-400">
            {data?.total_masuk ?? 0} / {data?.total_siswa ?? 0} suara masuk · {totalRevealed} sudah dibuka
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-8">
        {data?.candidates.map((c, i) => (
          <div key={c.candidate_id}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold">
                No. {c.nomor_urut} — {c.nama_ketua}
                {c.nama_wakil ? ` & ${c.nama_wakil}` : ''}
                {c.candidate_id === leaderId && totalRevealed > 0 && (
                  <span className="ml-3 rounded-full bg-gold px-3 py-1 text-sm font-bold text-slate-900">Unggul</span>
                )}
              </span>
              <span className="text-3xl font-bold tabular-nums">{c.jumlah_suara}</span>
            </div>
            <div className="h-8 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(c.jumlah_suara / maxCount) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            </div>
          </div>
        ))}
        {(!data || data.candidates.length === 0) && (
          <p className="text-center text-slate-400">Belum ada kandidat.</p>
        )}
      </div>
    </div>
  );
}
