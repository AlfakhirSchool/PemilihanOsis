'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.loginAdmin(username, password);
      localStorage.setItem('admin_token', res.accessToken);
      router.push('/admin/hitung-suara');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-xl font-bold text-teal">Admin / Panitia</h1>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <input
          className="w-full rounded-lg border border-slate-300 p-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-slate-300 p-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button disabled={loading} className="w-full rounded-lg bg-teal p-3 font-semibold text-white disabled:opacity-50">
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}
