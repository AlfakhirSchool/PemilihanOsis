'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

interface Candidate {
  candidate_id: string;
  nomor_urut: number;
  nama_ketua: string;
  nama_wakil: string | null;
  foto_url: string | null;
  jumlah_suara: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
function photoSrc(url: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}
interface Results {
  title: string | null;
  status: string | null;
  total_siswa: number;
  total_masuk: number;
  candidates: Candidate[];
}

// Urutan & hex tervalidasi lewat scripts/validate_palette.js (skill dataviz) untuk surface
// gelap #1a1a19 (dekat slate-900 kita) — lolos lightness band, chroma floor, CVD separation
// (worst adjacent ΔE 8.4 protan), dan contrast >=3:1. Jangan diubah tanpa re-validasi.
const SERIES_COLORS = ['#199e70', '#c98500', '#3987e5', '#d55181', '#9085e9'];
const POLL_MS = 4000;
const R = 120;
const STROKE = 34;
const GAP_DEG = 3; // celah antar segmen (setara "surface gap" di antara arc)
const CIRC = 2 * Math.PI * R;

// Halaman publik, tanpa login — dipasang di layar proyektor saat penghitungan suara.
// Cari election aktif sendiri, lalu poll hasil tiap POLL_MS. Cuma agregat (suara sudah
// direveal admin), tidak ada data per-siswa.
export default function LayarPage() {
  const [electionId, setElectionId] = useState<string | null>(null);
  const [data, setData] = useState<Results | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
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

  const candidates = data?.candidates ?? [];
  const totalRevealed = candidates.reduce((s, c) => s + c.jumlah_suara, 0);
  const leaderId = candidates.slice().sort((a, b) => b.jumlah_suara - a.jumlah_suara)[0]?.candidate_id;
  const n = candidates.length;
  const totalGapDeg = n > 1 ? GAP_DEG * n : 0;

  // Susun tiap kandidat jadi arc: panjang proporsional ke suara (dikurangi share celah),
  // rotasi kumulatif dari jam 12. strokeDasharray/offset dipakai per-segmen (bukan satu
  // path gabungan) supaya tiap arc bisa punya rounded cap sendiri.
  let cursorDeg = 0;
  const avatarOffset = R + STROKE / 2 + 34; // radius tempat foto duduk, di luar ring
  const arcs = candidates.map((c, i) => {
    const share = totalRevealed > 0 ? c.jumlah_suara / totalRevealed : n > 0 ? 1 / n : 0;
    const arcDeg = share * (360 - totalGapDeg);
    const startDeg = cursorDeg;
    cursorDeg += arcDeg + GAP_DEG;
    const arcLen = (arcDeg / 360) * CIRC;
    const midDeg = startDeg + arcDeg / 2 - 90; // -90: jam 12 = 0 rad di sistem sin/cos standar
    const midRad = (midDeg * Math.PI) / 180;
    return {
      candidate: c,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      pct: totalRevealed > 0 ? Math.round(share * 1000) / 10 : 0,
      dasharray: `${arcLen} ${CIRC - arcLen}`,
      dashoffset: CIRC * 0.25 - (startDeg / 360) * CIRC, // 0.25*CIRC = mulai dari jam 12
      avatarX: Math.cos(midRad) * avatarOffset,
      avatarY: Math.sin(midRad) * avatarOffset,
    };
  });

  const hovered = arcs.find((a) => a.candidate.candidate_id === hoverId);

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

      {candidates.length === 0 ? (
        <p className="text-center text-slate-400">Belum ada kandidat.</p>
      ) : (
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 md:flex-row md:items-center md:justify-center">
          <div className="relative shrink-0" style={{ width: 2 * avatarOffset + 60, height: 2 * avatarOffset + 60 }}>
            <svg
              width={2 * avatarOffset + 60}
              height={2 * avatarOffset + 60}
              viewBox={`0 0 ${2 * avatarOffset + 60} ${2 * avatarOffset + 60}`}
              className="absolute inset-0"
            >
              <g transform={`translate(${avatarOffset + 30}, ${avatarOffset + 30})`}>
                <circle r={R} fill="none" stroke="#2a2a28" strokeWidth={STROKE} />
                {arcs.map((a) => (
                  <circle
                    key={a.candidate.candidate_id}
                    r={R}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={a.dasharray}
                    strokeDashoffset={a.dashoffset}
                    opacity={hoverId && hoverId !== a.candidate.candidate_id ? 0.35 : 1}
                    className="cursor-pointer transition-opacity duration-200"
                    onMouseEnter={() => setHoverId(a.candidate.candidate_id)}
                    onMouseLeave={() => setHoverId(null)}
                  />
                ))}
              </g>
            </svg>

            {arcs.map((a) => {
              const src = photoSrc(a.candidate.foto_url);
              return (
                <button
                  key={a.candidate.candidate_id}
                  onMouseEnter={() => setHoverId(a.candidate.candidate_id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-4 transition-transform duration-200"
                  style={{
                    left: avatarOffset + 30 + a.avatarX,
                    top: avatarOffset + 30 + a.avatarY,
                    ['--tw-ring-color' as string]: a.color,
                    transform: `translate(-50%, -50%) scale(${hoverId === a.candidate.candidate_id ? 1.12 : 1})`,
                    background: '#1a1a19',
                  }}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold" style={{ color: a.color }}>
                      {a.candidate.nomor_urut}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              {hovered ? (
                <>
                  <span className="text-4xl font-bold tabular-nums">{hovered.candidate.jumlah_suara}</span>
                  <span className="mt-1 max-w-[10rem] text-xs text-slate-300">No. {hovered.candidate.nomor_urut} · {hovered.pct}%</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold tabular-nums">{totalRevealed}</span>
                  <span className="mt-1 text-xs text-slate-400">suara dibuka</span>
                </>
              )}
            </div>
          </div>

          <div className="flex w-full max-w-md flex-col gap-3">
            {arcs.map((a) => (
              <div
                key={a.candidate.candidate_id}
                onMouseEnter={() => setHoverId(a.candidate.candidate_id)}
                onMouseLeave={() => setHoverId(null)}
                className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors duration-150"
                style={{ background: hoverId === a.candidate.candidate_id ? 'rgba(255,255,255,0.06)' : 'transparent' }}
              >
                {photoSrc(a.candidate.foto_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoSrc(a.candidate.foto_url)!}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover ring-2"
                    style={{ ['--tw-ring-color' as string]: a.color }}
                  />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden />
                )}
                <span className="flex-1 text-lg font-medium">
                  No. {a.candidate.nomor_urut} — {a.candidate.nama_ketua}
                  {a.candidate.nama_wakil ? ` & ${a.candidate.nama_wakil}` : ''}
                  {a.candidate.candidate_id === leaderId && totalRevealed > 0 && (
                    <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-slate-900">Unggul</span>
                  )}
                </span>
                <span className="tabular-nums text-slate-300">{a.pct}%</span>
                <span className="w-10 text-right text-xl font-bold tabular-nums">{a.candidate.jumlah_suara}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabel data mentah — setara aksesibilitas untuk pembaca yang tidak bisa pakai chart visual. */}
      <table className="sr-only">
        <caption>Hasil sementara {data?.title}</caption>
        <thead>
          <tr>
            <th>No.</th>
            <th>Kandidat</th>
            <th>Suara</th>
            <th>Persentase</th>
          </tr>
        </thead>
        <tbody>
          {arcs.map((a) => (
            <tr key={a.candidate.candidate_id}>
              <td>{a.candidate.nomor_urut}</td>
              <td>
                {a.candidate.nama_ketua}
                {a.candidate.nama_wakil ? ` & ${a.candidate.nama_wakil}` : ''}
              </td>
              <td>{a.candidate.jumlah_suara}</td>
              <td>{a.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
