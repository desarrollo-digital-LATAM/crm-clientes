import { createSupabaseBrowserClient } from '../supabase/browser';

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'MEMBER';
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = createSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new Error('La sesión no está disponible.');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('No se pudo obtener el usuario.');
  return response.json() as Promise<CurrentUser>;
}
