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

interface TimelinePoint {
  candidate_id: string;
  t: string;
  cumulative: number;
}

// Kurva halus lewat titik tengah tiap segmen (quadratic bezier), bukan garis patah-patah —
// ini yang bikin efek "bergelombang" tanpa perlu librari charting.
function smoothPath(pts: [number, number][]): string {
  if (pts.length === 0) return '';
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 2; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const mx = (x1 + x0) / 2;
    const my = (y1 + y0) / 2;
    d += i === 0 ? ` Q ${x0},${y0} ${mx},${my}` : ` T ${mx},${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` T ${last[0]},${last[1]}`;
  return d;
}

// Halaman publik, tanpa login — dipasang di layar proyektor saat penghitungan suara.
// Cari election aktif sendiri, lalu poll hasil tiap POLL_MS. Cuma agregat (suara sudah
// direveal admin), tidak ada data per-siswa.
export default function LayarPage() {
  const [electionId, setElectionId] = useState<string | null>(null);
  const [data, setData] = useState<Results | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.publicActiveId().then((r) => setElectionId(r.election_id));
  }, []);

  useEffect(() => {
    if (!electionId) return;
    const poll = () => {
      api.publicResults(electionId).then(setData).catch(() => {});
      api.publicTimeline(electionId).then((r) => setTimeline(r.points)).catch(() => {});
    };
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

  // Sumbu-x = urutan event reveal global (bukan waktu asli — jarak antar reveal admin
  // bisa timpang, indeks bikin gelombangnya rapat & enak dibaca di layar proyektor).
  const W = 760;
  const H = 220;
  const PAD = 28;
  const maxCum = Math.max(1, ...arcs.map((a) => a.candidate.jumlah_suara));
  const xFor = (i: number) => (timeline.length <= 1 ? PAD : PAD + (i / (timeline.length - 1)) * (W - 2 * PAD));
  const yFor = (v: number) => H - PAD - (v / maxCum) * (H - 2 * PAD);

  const series = arcs.map((a) => {
    let running = 0;
    const pts: [number, number][] = timeline.map((p, i) => {
      if (p.candidate_id === a.candidate.candidate_id) running = p.cumulative;
      return [xFor(i), yFor(running)];
    });
    if (pts.length === 0) pts.push([PAD, yFor(0)], [W - PAD, yFor(0)]);
    return { ...a, pts };
  });

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

      {candidates.length > 0 && timeline.length > 1 && (
        <div className="mx-auto mt-10 max-w-4xl">
          <h2 className="mb-2 text-sm font-semibold text-slate-400">Trend suara masuk</h2>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
            <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#3a3a37" strokeWidth={1} />
            {series.map((s) => (
              <path key={`fill-${s.candidate.candidate_id}`} d={`${smoothPath(s.pts)} L ${W - PAD},${H - PAD} L ${PAD},${H - PAD} Z`} fill={s.color} opacity={hoverId && hoverId !== s.candidate.candidate_id ? 0.04 : 0.14} />
            ))}
            {series.map((s) => (
              <path
                key={`line-${s.candidate.candidate_id}`}
                d={smoothPath(s.pts)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={hoverId && hoverId !== s.candidate.candidate_id ? 0.35 : 1}
                className="cursor-pointer transition-opacity duration-200"
                onMouseEnter={() => setHoverId(s.candidate.candidate_id)}
                onMouseLeave={() => setHoverId(null)}
              />
            ))}
            {series.map((s) => {
              const [x, y] = s.pts[s.pts.length - 1];
              return <circle key={`dot-${s.candidate.candidate_id}`} cx={x} cy={y} r={4} fill={s.color} />;
            })}
          </svg>
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
