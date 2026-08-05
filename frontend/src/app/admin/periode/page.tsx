'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useElections } from '@/lib/useElections';

export default function PeriodePage() {
  const { elections, select } = useElections();
  const [form, setForm] = useState({ title: '', jenjang: 'SMP', start_time: '', end_time: '' });
  const [error, setError] = useState('');
  const [, force] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createElection(form);
      setForm({ title: '', jenjang: 'SMP', start_time: '', end_time: '' });
      force((n) => n + 1);
      location.reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function setStatus(id: string, status: string) {
    await api.setElectionStatus(id, status);
    location.reload();
  }

  return (
    <div>
      <form onSubmit={submit} className="mb-6 grid max-w-md gap-2 rounded-lg border bg-white p-4">
        <h2 className="font-semibold text-slate-700">Buat Periode Baru</h2>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <input className="rounded border p-2" placeholder="Judul" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <select className="rounded border p-2" value={form.jenjang} onChange={(e) => setForm({ ...form, jenjang: e.target.value })}>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
        </select>
        <label className="text-sm text-slate-500">Mulai</label>
        <input type="datetime-local" className="rounded border p-2" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
        <label className="text-sm text-slate-500">Selesai</label>
        <input type="datetime-local" className="rounded border p-2" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
        <button className="rounded bg-teal p-2 font-semibold text-white">Buat</button>
      </form>

      <div className="space-y-2">
        {elections.map((el) => (
          <div key={el.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div>
              <p className="font-semibold">{el.title}</p>
              <p className="text-sm text-slate-500">{el.jenjang} · {el.status}</p>
            </div>
            <div className="flex gap-2">
              {el.status === 'draft' && <button onClick={() => setStatus(el.id, 'active')} className="rounded bg-teal px-3 py-1 text-sm text-white">Buka</button>}
              {el.status === 'active' && <button onClick={() => setStatus(el.id, 'closed')} className="rounded bg-red-600 px-3 py-1 text-sm text-white">Tutup</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
