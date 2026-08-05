'use client';

import { ElectionRow } from '@/lib/useElections';

export default function ElectionPicker({
  elections,
  selectedId,
  onSelect,
}: {
  elections: ElectionRow[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      className="mb-6 rounded-lg border border-slate-300 p-2 text-sm"
    >
      {elections.map((e) => (
        <option key={e.id} value={e.id}>
          {e.title} ({e.jenjang}, {e.status})
        </option>
      ))}
    </select>
  );
}
