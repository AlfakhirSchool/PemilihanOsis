'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

interface Candidate {
  id: string;
  nomorUrut: number;
  namaKetua: string;
  namaWakil: string | null;
  fotoUrl: string | null;
  visiMisi: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
function photoSrc(url: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

interface Election {
  id: string;
  title: string;
  candidates: Candidate[];
}

type Stage = 'login' | 'pilih' | 'konfirmasi' | 'terkirim' | 'sudah_vote';

export default function VotePage() {
  const [stage, setStage] = useState<Stage>('login');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [election, setElection] = useState<Election | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);

  useEffect(() => {
    if (localStorage.getItem('siswa_token')) loadElection();
  }, []);

  useEffect(() => {
    if (stage !== 'terkirim') return;
    const t = setTimeout(nextVoter, 3000);
    return () => clearTimeout(t);
  }, [stage]);

  async function loadElection() {
    try {
      const el = await api.activeElection();
      setElection(el);
      const status = await api.electionStatus(el.id);
      setStage(status.sudah_vote ? 'sudah_vote' : 'pilih');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.loginSiswa(code);
      localStorage.setItem('siswa_token', res.accessToken);
      await loadElection();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitVote() {
    if (!election || !selected) return;
    setLoading(true);
    setError('');
    try {
      await api.vote(election.id, selected.id);
      // Device dipakai bergantian (antrean beberapa HP) — bersihin sesi siswa ini
      // sekarang juga, jangan tunggu klik, biar refresh tak sengaja gak kebuka punya orang lain.
      localStorage.removeItem('siswa_token');
      setStage('terkirim');
    } catch (e) {
      setError((e as Error).message);
      setStage('pilih');
    } finally {
      setLoading(false);
    }
  }

  function nextVoter() {
    localStorage.removeItem('siswa_token');
    setCode('');
    setSelected(null);
    setElection(null);
    setError('');
    setStage('login');
  }

  if (stage === 'login') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-lg">
          <Image src="/osalfa-logo.png" alt="OSALFA" width={524} height={476} priority className="mx-auto h-20 w-auto" />
          <h1 className="text-center text-xl font-bold text-teal">OSALFA — Pemilihan Ketua OSIS</h1>
          <p className="text-center text-sm text-slate-500">SMP Islam Modern Al Fakhir</p>
          {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
          <input
            className="w-full rounded-lg border border-slate-300 p-3 text-center text-lg tracking-widest uppercase"
            placeholder="Kode Pemilih"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-lg bg-teal p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </main>
    );
  }

  if (stage === 'sudah_vote') {
    return (
      <Center>
        <h1 className="text-2xl font-bold text-teal">Anda sudah memilih</h1>
        <p className="mt-2 text-slate-500">Suara Anda sudah tercatat, tidak bisa vote ulang.</p>
        <button onClick={nextVoter} className="mt-6 w-full rounded-lg bg-teal p-3 font-semibold text-white">
          Selesai — Pemilih Berikutnya
        </button>
      </Center>
    );
  }

  if (stage === 'terkirim') {
    return (
      <Center>
        <h1 className="text-2xl font-bold text-teal">Suara terkirim ✓</h1>
        <p className="mt-2 text-slate-500">Terima kasih sudah memilih.</p>
        <p className="mt-1 text-xs text-slate-400">Otomatis kembali ke halaman kode dalam 3 detik...</p>
        <button onClick={nextVoter} className="mt-6 w-full rounded-lg bg-teal p-3 font-semibold text-white">
          Selesai — Pemilih Berikutnya
        </button>
      </Center>
    );
  }

  if (stage === 'konfirmasi' && selected) {
    return (
      <Center>
        <h1 className="text-lg font-bold text-slate-700">Konfirmasi pilihan Anda</h1>
        <div className="mt-4 overflow-hidden rounded-xl border-2 border-teal">
          {photoSrc(selected.fotoUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc(selected.fotoUrl)!} alt="" className="h-40 w-full object-cover" />
          )}
          <div className="p-4 text-center">
            <p className="text-sm text-slate-500">No. Urut {selected.nomorUrut}</p>
            <p className="text-lg font-bold">{selected.namaKetua}{selected.namaWakil ? ` & ${selected.namaWakil}` : ''}</p>
          </div>
        </div>
        {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button onClick={() => setStage('pilih')} className="flex-1 rounded-lg border border-slate-300 p-3">
            Batal
          </button>
          <button
            onClick={submitVote}
            disabled={loading}
            className="flex-1 rounded-lg bg-teal p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Suara'}
          </button>
        </div>
      </Center>
    );
  }

  // stage === 'pilih'
  return (
    <main className="min-h-screen px-4 py-10">
      <h1 className="mb-6 text-center text-xl font-bold text-teal">{election?.title || 'Pilih Ketua OSIS'}</h1>
      {error && <p className="mx-auto mb-4 max-w-md rounded bg-red-50 p-2 text-center text-sm text-red-600">{error}</p>}
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {election?.candidates.map((c) => {
          const src = photoSrc(c.fotoUrl);
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelected(c);
                setStage('konfirmasi');
              }}
              className="overflow-hidden rounded-xl bg-white text-left shadow transition hover:ring-2 hover:ring-teal"
            >
              <div className="flex h-48 items-center justify-center bg-slate-100">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-300">No. {c.nomorUrut}</span>
                )}
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold text-gold-dark">No. Urut {c.nomorUrut}</p>
                <p className="mt-1 text-lg font-bold">{c.namaKetua}{c.namaWakil ? ` & ${c.namaWakil}` : ''}</p>
                {c.visiMisi && <p className="mt-2 line-clamp-3 text-sm text-slate-500">{c.visiMisi}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">{children}</div>
    </main>
  );
}
