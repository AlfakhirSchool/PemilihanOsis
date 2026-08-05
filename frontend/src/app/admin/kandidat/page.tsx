'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useElections } from '@/lib/useElections';
import ElectionPicker from '../ElectionPicker';
import PhotoCropper from '../PhotoCropper';

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
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // biar pilih file yang sama lagi tetap trigger onChange
    if (file) setCropFile(file);
  }

  async function handleCropped(blob: Blob) {
    setCropFile(null);
    setError('');
    setUploading(true);
    try {
      const { url } = await api.uploadFile(new File([blob], 'foto.jpg', { type: 'image/jpeg' }));
      setForm((f) => ({ ...f, foto_url: url }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

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
      {cropFile && <PhotoCropper file={cropFile} onCancel={() => setCropFile(null)} onCropped={handleCropped} />}

      <ElectionPicker elections={elections} selectedId={selectedId} onSelect={select} />

      <form onSubmit={submit} className="mb-6 grid max-w-xl gap-2 rounded-lg border bg-white p-4">
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <input className="rounded border p-2" placeholder="No. Urut" value={form.nomor_urut} onChange={(e) => setForm({ ...form, nomor_urut: e.target.value })} required />
        <input className="rounded border p-2" placeholder="Nama Ketua" value={form.nama_ketua} onChange={(e) => setForm({ ...form, nama_ketua: e.target.value })} required />
        <input className="rounded border p-2" placeholder="Nama Wakil" value={form.nama_wakil} onChange={(e) => setForm({ ...form, nama_wakil: e.target.value })} />
        <div>
          <label className="mb-1 block text-sm text-slate-500">Foto</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} className="w-full text-sm" />
          {uploading && <p className="mt-1 text-sm text-slate-400">Mengunggah...</p>}
          {form.foto_url && !uploading && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${process.env.NEXT_PUBLIC_API_URL}${form.foto_url}`} alt="Preview" className="mt-2 h-24 w-24 rounded object-cover" />
          )}
        </div>
        <textarea className="rounded border p-2" placeholder="Visi Misi" value={form.visi_misi} onChange={(e) => setForm({ ...form, visi_misi: e.target.value })} />
        <button className="rounded bg-teal p-2 font-semibold text-white">Tambah Kandidat</button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {candidates.map((c) => (
          <div key={c.id} className="flex gap-3 rounded-lg border bg-white p-4">
            {c.fotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${process.env.NEXT_PUBLIC_API_URL}${c.fotoUrl}`} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />
            )}
            <div>
              <p className="text-sm font-semibold text-gold-dark">No. {c.nomorUrut}</p>
              <p className="font-bold">{c.namaKetua}{c.namaWakil ? ` & ${c.namaWakil}` : ''}</p>
              <button onClick={() => remove(c.id)} className="mt-2 text-sm text-red-600">Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
