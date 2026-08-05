'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useElections } from '@/lib/useElections';
import ElectionPicker from '../ElectionPicker';

interface CodeRow {
  code: string;
  used: boolean;
}

export default function KodePage() {
  const { elections, selectedId, select } = useElections();
  const [count, setCount] = useState('50');
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, used: 0, unused: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    refresh();
    // Status "sudah dipakai" berubah tiap ada siswa vote — poll biar tabel selalu kebaruan
    // tanpa admin harus reload manual.
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [selectedId]);

  async function refresh() {
    const res = await api.listCodes(selectedId);
    setCodes(res.codes);
    setSummary({ total: res.total, used: res.used, unused: res.unused });
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.generateCodes(selectedId, Number(count));
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const csv = ['code', ...codes.map((c) => c.code)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kode-pemilih.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <ElectionPicker elections={elections} selectedId={selectedId} onSelect={select} />

      <form onSubmit={generate} className="mb-6 flex max-w-md items-end gap-2 rounded-lg border bg-white p-4">
        <div className="flex-1">
          <label className="block text-sm text-slate-500">Jumlah kode baru</label>
          <input
            className="mt-1 w-full rounded border p-2"
            type="number"
            min={1}
            max={5000}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            required
          />
        </div>
        <button disabled={loading} className="rounded bg-teal p-2 px-4 font-semibold text-white disabled:opacity-50">
          {loading ? 'Membuat...' : 'Generate'}
        </button>
      </form>
      {error && <p className="mb-4 max-w-md rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex items-center gap-4">
        <p className="text-sm text-slate-600">
          Total: {summary.total} · Terpakai: {summary.used} · Belum: {summary.unused}
        </p>
        <button onClick={exportCsv} disabled={codes.length === 0} className="rounded border px-3 py-1 text-sm font-medium disabled:opacity-50">
          Export CSV
        </button>
      </div>

      <div className="max-h-[28rem] overflow-y-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Kode</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code} className="border-t">
                <td className="px-3 py-1.5 font-mono">{c.code}</td>
                <td className="px-3 py-1.5">
                  {c.used ? <span className="text-slate-400">Terpakai</span> : <span className="text-teal">Belum dipakai</span>}
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={2} className="p-3 text-center text-slate-400">
                  Belum ada kode.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
