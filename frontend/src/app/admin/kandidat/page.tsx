'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useElections } from '@/lib/useElections';
import ElectionPicker from '../ElectionPicker';

interface Candidate {
  id: string;
  nomorUrut: number;
  namaKetua: string;
  namaWakil: string | null;
  fotoUrl: string | null;
  visiMisi: string | null;
}

export default function KandidatPage() {
  const { elections, selectedId, select } = useElections();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [form, setForm] = useState({ nomor_urut: '', nama_ketua: '', nama_wakil: '', foto_url: '', visi_misi: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedId) refresh();
  }, [selectedId]);

  async function refresh() {
    setCandidates(await api.listCandidates(selectedId));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createCandidate({
        election_id: selectedId,
        nomor_urut: Number(form.nomor_urut),
        nama_ketua: form.nama_ketua,
        nama_wakil: form.nama_wakil || undefined,
        foto_url: form.foto_url || undefined,
        visi_misi: form.visi_misi || undefined,
      });
      setForm({ nomor_urut: '', nama_ketua: '', nama_wakil: '', foto_url: '', visi_misi: '' });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    await api.deleteCandidate(id);
    refresh();
  }

  return (
    <div>
      <ElectionPicker elections={elections} selectedId={selectedId} onSelect={select} />

      <form onSubmit={submit} className="mb-6 grid max-w-xl gap-2 rounded-lg border bg-white p-4">
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <input className="rounded border p-2" placeholder="No. Urut" value={form.nomor_urut} onChange={(e) => setForm({ ...form, nomor_urut: e.target.value })} required />
        <input className="rounded border p-2" placeholder="Nama Ketua" value={form.nama_ketua} onChange={(e) => setForm({ ...form, nama_ketua: e.target.value })} required />
        <input className="rounded border p-2" placeholder="Nama Wakil" value={form.nama_wakil} onChange={(e) => setForm({ ...form, nama_wakil: e.target.value })} />
        <input className="rounded border p-2" placeholder="URL Foto" value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} />
        <textarea className="rounded border p-2" placeholder="Visi Misi" value={form.visi_misi} onChange={(e) => setForm({ ...form, visi_misi: e.target.value })} />
        <button className="rounded bg-biru p-2 font-semibold text-white">Tambah Kandidat</button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {candidates.map((c) => (
          <div key={c.id} className="rounded-lg border bg-white p-4">
            <p className="text-sm font-semibold text-oranye">No. {c.nomorUrut}</p>
            <p className="font-bold">{c.namaKetua}{c.namaWakil ? ` & ${c.namaWakil}` : ''}</p>
            <button onClick={() => remove(c.id)} className="mt-2 text-sm text-red-600">Hapus</button>
          </div>
        ))}
      </div>
    </div>
  );
}
