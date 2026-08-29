import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import LogoutButton from './logout-button';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 sm:p-10">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">CRM Clientes</p>
            <h1 className="mt-2 text-2xl font-semibold">Bienvenido</h1>
            <p className="mt-2 text-slate-600">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
        <p className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-500">El dashboard operativo se construirá en una fase posterior.</p>
      </div>
    </main>
  );
}
