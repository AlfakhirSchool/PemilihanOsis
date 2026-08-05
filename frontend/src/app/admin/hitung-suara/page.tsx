'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useElections } from '@/lib/useElections';
import ElectionPicker from '../ElectionPicker';

interface Pending {
  vote_id: string;
  code: string;
}
interface Revealed {
  vote_id: string;
  code: string;
  candidate: { id: string; nomor_urut: number; nama_ketua: string };
}
interface Progress {
  total_siswa: number;
  total_masuk: number;
  partisipasi_pct: number;
}

const BAR_COLORS = ['#125E63', '#FAC760', '#0E464A', '#DA9407', '#5C4A1E'];

export default function HitungSuaraPage() {
  const { elections, selectedId, select } = useElections();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [revealed, setRevealed] = useState<Revealed[]>([]);
  const [tally, setTally] = useState<Record<string, { nama: string; count: number }>>({});

  useEffect(() => {
    if (!selectedId) return;
    refresh();
  }, [selectedId]);

  async function refresh() {
    const [p, pend] = await Promise.all([api.progress(selectedId), api.pending(selectedId)]);
    setProgress(p);
    setPending(pend);
  }

  async function reveal(voteId: string) {
    const res = await api.reveal(selectedId, voteId);
    setPending((prev) => prev.filter((v) => v.vote_id !== voteId));
    setRevealed((prev) => [{ vote_id: voteId, code: res.code, candidate: res.candidate }, ...prev]);
    setTally((prev) => {
      const key = res.candidate.id;
      const cur = prev[key] || { nama: res.candidate.nama_ketua, count: 0 };
      return { ...prev, [key]: { ...cur, count: cur.count + 1 } };
    });
  }

  const maxCount = Math.max(1, ...Object.values(tally).map((t) => t.count));
  const leaderId = Object.entries(tally).sort((a, b) => b[1].count - a[1].count)[0]?.[0];

  return (
    <div>
      <ElectionPicker elections={elections} selectedId={selectedId} onSelect={select} />

      {progress && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Partisipasi</span>
            <span>{progress.total_masuk} / {progress.total_siswa} ({progress.partisipasi_pct}%)</span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{ width: `${progress.partisipasi_pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold text-slate-700">Belum dibuka ({pending.length})</h2>
          <ul className="max-h-96 space-y-1 overflow-y-auto rounded-lg border bg-white p-2">
            {pending.map((v) => (
              <li key={v.vote_id}>
                <button
                  onClick={() => reveal(v.vote_id)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gold-dark/10"
                >
                  Kode {v.code}
                </button>
              </li>
            ))}
            {pending.length === 0 && <li className="p-3 text-sm text-slate-400">Tidak ada lagi.</li>}
          </ul>

          {revealed.length > 0 && (
            <>
              <h2 className="mb-2 mt-4 font-semibold text-slate-700">Sudah dibuka ({revealed.length})</h2>
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-white p-2 text-sm text-slate-500">
                {revealed.map((r) => (
                  <li key={r.vote_id} className="px-3 py-1">
                    Kode {r.code} → No. {r.candidate.nomor_urut} {r.candidate.nama_ketua}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-slate-700">Hasil sementara</h2>
          <div className="space-y-3 rounded-lg border bg-white p-4">
            {Object.entries(tally).map(([id, t], i) => (
              <div key={id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {t.nama} {id === leaderId && <span className="ml-1 rounded-full bg-gold-dark px-2 py-0.5 text-xs text-white">Unggul</span>}
                  </span>
                  <span className="text-slate-500">{t.count}</span>
                </div>
                <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(t.count / maxCount) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(tally).length === 0 && <p className="text-sm text-slate-400">Belum ada suara dibuka.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
