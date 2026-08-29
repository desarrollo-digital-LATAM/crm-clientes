'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/browser';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await createSupabaseBrowserClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60" onClick={logout} disabled={loading}>{loading ? 'Cerrando...' : 'Cerrar sesión'}</button>;
}
