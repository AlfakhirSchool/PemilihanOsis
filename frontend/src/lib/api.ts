const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request(path: string, opts: RequestInit = {}, tokenKey?: 'siswa_token' | 'admin_token') {
  const token = tokenKey ? localStorage.getItem(tokenKey) : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
  return data;
}

async function uploadFile(file: File): Promise<{ url: string }> {
  const token = localStorage.getItem('admin_token');
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API_URL}/admin/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload gagal');
  return data;
}

export const api = {
  uploadFile,

  loginSiswa: (code: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ code }) }),
  loginAdmin: (username: string, password: string) =>
    request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  activeElection: () => request('/election/active', {}, 'siswa_token'),
  electionStatus: (id: string) => request(`/election/${id}/status`, {}, 'siswa_token'),
  vote: (id: string, candidateId: string) =>
    request(`/election/${id}/vote`, { method: 'POST', body: JSON.stringify({ candidate_id: candidateId }) }, 'siswa_token'),

  progress: (id: string) => request(`/admin/election/${id}/progress`, {}, 'admin_token'),
  pending: (id: string) => request(`/admin/election/${id}/pending`, {}, 'admin_token'),
  reveal: (id: string, voteId: string) =>
    request(`/admin/election/${id}/reveal`, { method: 'POST', body: JSON.stringify({ vote_id: voteId }) }, 'admin_token'),
  results: (id: string) => request(`/admin/election/${id}/results`, {}, 'admin_token'),
  listElections: () => request('/admin/election', {}, 'admin_token'),
  createElection: (body: Record<string, unknown>) =>
    request('/admin/election', { method: 'POST', body: JSON.stringify(body) }, 'admin_token'),
  setElectionStatus: (id: string, status: string) =>
    request(`/admin/election/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }, 'admin_token'),
  listCandidates: (electionId: string) => request(`/admin/candidates/${electionId}`, {}, 'admin_token'),
  createCandidate: (body: Record<string, unknown>) =>
    request('/admin/candidates', { method: 'POST', body: JSON.stringify(body) }, 'admin_token'),
  deleteCandidate: (id: string) => request(`/admin/candidates/${id}`, { method: 'DELETE' }, 'admin_token'),

  generateCodes: (electionId: string, count: number) =>
    request(`/admin/election/${electionId}/codes/generate`, { method: 'POST', body: JSON.stringify({ count }) }, 'admin_token'),
  listCodes: (electionId: string) => request(`/admin/election/${electionId}/codes`, {}, 'admin_token'),

  publicActiveId: () => request('/public/election/active-id'),
  publicResults: (id: string) => request(`/public/election/${id}/results`),
  publicTimeline: (id: string) => request(`/public/election/${id}/timeline`),
};
