'use client';

import { useEffect, useRef, useState } from 'react';

const VIEWPORT = 280; // px, kotak crop di layar
const OUTPUT = 480; // px, resolusi hasil crop yang diupload

interface Props {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}

// Crop tool custom: geser (drag) + zoom (slider), kotak 1:1. Tanpa librari — cukup
// <canvas> buat rasterize hasil crop pas user klik Simpan.
export default function PhotoCropper({ file, onCancel, onCropped }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const s = VIEWPORT / Math.min(image.naturalWidth, image.naturalHeight);
      setMinScale(s);
      setScale(s);
      setOffset({ x: (VIEWPORT - image.naturalWidth * s) / 2, y: (VIEWPORT - image.naturalHeight * s) / 2 });
      setImg(image);
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clampOffset(o: { x: number; y: number }, s: number) {
    if (!img) return o;
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    return {
      x: Math.min(0, Math.max(VIEWPORT - w, o.x)),
      y: Math.min(0, Math.max(VIEWPORT - h, o.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clampOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }, scale));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function onZoom(newScale: number) {
    if (!img) return;
    // Zoom dari titik tengah viewport biar gak "lompat".
    const cx = VIEWPORT / 2;
    const cy = VIEWPORT / 2;
    const factor = newScale / scale;
    const nx = cx - (cx - offset.x) * factor;
    const ny = cy - (cy - offset.y) * factor;
    setScale(newScale);
    setOffset(clampOffset({ x: nx, y: ny }, newScale));
  }

  function confirm() {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const k = OUTPUT / VIEWPORT;
    ctx.drawImage(img, offset.x * k, offset.y * k, img.naturalWidth * scale * k, img.naturalHeight * scale * k);
    canvas.toBlob((blob) => blob && onCropped(blob), 'image/jpeg', 0.88);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="rounded-xl bg-white p-5">
        <p className="mb-3 text-center text-sm font-semibold text-slate-600">Atur ukuran & posisi foto</p>
        <div
          className="mx-auto touch-none select-none overflow-hidden rounded-lg bg-slate-100"
          style={{ width: VIEWPORT, height: VIEWPORT, cursor: 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.src}
              alt=""
              draggable={false}
              style={{
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                maxWidth: 'none',
              }}
            />
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-400">Zoom</span>
          <input
            type="range"
            min={minScale}
            max={minScale * 3}
            step={minScale / 50}
            value={scale}
            onChange={(e) => onZoom(Number(e.target.value))}
            className="flex-1"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 p-2 text-sm">
            Batal
          </button>
          <button onClick={confirm} className="flex-1 rounded-lg bg-teal p-2 text-sm font-semibold text-white">
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
