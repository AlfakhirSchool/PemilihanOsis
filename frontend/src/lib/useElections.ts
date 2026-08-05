'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface ElectionRow {
  id: string;
  title: string;
  jenjang: 'SMP';
  status: 'draft' | 'active' | 'closed';
  startTime: string;
  endTime: string;
}

// ponytail: satu dropdown pilih periode, disimpan di localStorage — cukup untuk jumlah periode pemilihan yang kecil.
export function useElections() {
  const [elections, setElections] = useState<ElectionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    api.listElections().then((rows: ElectionRow[]) => {
      setElections(rows);
      const saved = localStorage.getItem('selected_election_id');
      const fallback = rows.find((r) => r.status === 'active')?.id || rows[0]?.id || '';
      setSelectedId(saved && rows.some((r) => r.id === saved) ? saved : fallback);
    });
  }, []);

  function select(id: string) {
    setSelectedId(id);
    localStorage.setItem('selected_election_id', id);
  }

  return { elections, selectedId, select };
}
