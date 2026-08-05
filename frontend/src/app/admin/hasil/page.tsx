'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useElections } from '@/lib/useElections';
import ElectionPicker from '../ElectionPicker';

interface Result {
  candidate_id: string;
  nomor_urut: number;
  nama_ketua: string;
  nama_wakil: string | null;
  jumlah_suara: number;
}

export default function HasilPage() {
  const { elections, selectedId, select } = useElections();
  const [results, setResults] = useState<Result[]>([]);
  const election = elections.find((e) => e.id === selectedId);

  useEffect(() => {
    if (selectedId) api.results(selectedId).then(setResults);
  }, [selectedId]);

  function exportCsv() {
    const rows = [
      ['No. Urut', 'Ketua', 'Wakil', 'Jumlah Suara'],
      ...results.map((r) => [r.nomor_urut, r.nama_ketua, r.nama_wakil || '', r.jumlah_suara]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hasil-${election?.title || 'osis'}.csv`;
    a.click();
  }

  return (
    <div>
      <ElectionPicker elections={elections} selectedId={selectedId} onSelect={select} />

      {election?.status !== 'closed' && (
        <p className="mb-4 rounded bg-oranye/10 p-3 text-sm text-oranye">
          Periode belum ditutup — hasil ini masih bisa berubah.
        </p>
      )}

      <table className="w-full overflow-hidden rounded-lg border bg-white text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="p-3">No.</th>
            <th className="p-3">Ketua & Wakil</th>
            <th className="p-3 text-right">Suara</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.candidate_id} className="border-t">
              <td className="p-3">{r.nomor_urut}</td>
              <td className="p-3">{r.nama_ketua}{r.nama_wakil ? ` & ${r.nama_wakil}` : ''}</td>
              <td className="p-3 text-right font-semibold">{r.jumlah_suara}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={exportCsv}
        disabled={election?.status !== 'closed'}
        className="mt-4 rounded-lg bg-biru px-4 py-2 font-semibold text-white disabled:opacity-40"
      >
        Export CSV
      </button>
    </div>
  );
}
