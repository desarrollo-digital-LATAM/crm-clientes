'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { RefreshCw } from 'lucide-react';
import { fetchCurrentUser } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';

const anonymousDisplayUser = { name: null, email: 'Usuario' };
const SHELL_CLASS = 'crm-shell-active';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const rejectingSession = useRef(false);
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarCollapsed, () => false);
  const profileQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => failureCount < 1 && (!(error instanceof ApiError) || !error.status || error.status >= 500),
  });
  const user = profileQuery.data ?? anonymousDisplayUser;
  const unauthorized = profileQuery.error instanceof ApiError && profileQuery.error.status === 401;
  const forbidden = profileQuery.error instanceof ApiError && profileQuery.error.status === 403;

  useEffect(() => {
    document.body.classList.add(SHELL_CLASS);
    return () => document.body.classList.remove(SHELL_CLASS);
  }, []);

  useEffect(() => {
    if (!(profileQuery.error instanceof ApiError) || profileQuery.error.status !== 401 || rejectingSession.current) return;
    rejectingSession.current = true;

    router.replace('/login');
    router.refresh();
  }, [profileQuery.error, router]);

  useEffect(() => {
    if (!mobileOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  function toggleSidebar() {
    localStorage.setItem('crm-sidebar-collapsed', String(!collapsed));
    window.dispatchEvent(new Event('crm-sidebar-change'));
  }

  if (profileQuery.isPending || unauthorized) {
    return <SessionGate message={unauthorized ? 'Redirigiendo al inicio de sesión...' : 'Validando sesión...'} />;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      <div className={`hidden shrink-0 transition-[width] duration-200 lg:block ${collapsed ? 'w-[72px]' : 'w-[248px]'}`}>
        <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} user={user} />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" role="presentation" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-[min(84vw,320px)]" role="dialog" aria-label="Menú de navegación" onClick={(event) => event.stopPropagation()}>
            <AppSidebar onNavigate={() => setMobileOpen(false)} user={user} />
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1 flex flex-col h-dvh">
        <AppHeader user={user} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto px-5 py-9 sm:px-10 sm:py-11">
          {profileQuery.error && !forbidden && <ProfileErrorNotice error={profileQuery.error} loading={profileQuery.isFetching} onRetry={() => profileQuery.refetch()} />}
          {forbidden && <AccessDenied />}
          {profileQuery.data && children}
        </main>
      </div>
    </div>
  );
}

function AccessDenied() {
  return <section className="mx-auto max-w-xl rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center"><h1 className="text-xl font-semibold">No tienes acceso a este CRM.</h1><p className="mt-2 text-sm text-[var(--muted-foreground)]">Tu usuario no está autorizado para acceder.</p></section>;
}

function SessionGate({ message }: { message: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6"><p className="text-sm text-[var(--muted-foreground)]">{message}</p></main>;
}

function ProfileErrorNotice({ error, loading, onRetry }: { error: Error; loading: boolean; onRetry: () => void }) {
  const message = getProfileErrorMessage(error);
  return <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--foreground)] sm:flex-row sm:items-center sm:justify-between"><span>{message}</span><button type="button" onClick={onRetry} disabled={loading} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-amber-500/40 px-3 text-sm font-medium hover:bg-amber-500/10 disabled:opacity-60"><RefreshCw size={15} />{loading ? 'Reintentando...' : 'Reintentar'}</button></div>;
}

function getProfileErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) return 'No pudimos cargar tu perfil. Intenta nuevamente.';
  if (error.status === 401) return 'Tu sesión expiró o no es válida. Cerrando sesión...';
  if (error.status === 408) return 'El servidor tardó demasiado en responder. Puedes continuar y reintentar.';
  if (error.status && error.status >= 500) return 'El servidor respondió con un error. Puedes continuar y reintentar.';
  if (error.status) return `No pudimos cargar tu perfil (HTTP ${error.status}).`;
  return 'No pudimos conectar con el servidor. Puedes continuar y reintentar.';
}

function subscribeSidebar(callback: () => void) {
  window.addEventListener('crm-sidebar-change', callback);
  return () => window.removeEventListener('crm-sidebar-change', callback);
}

function getSidebarCollapsed() {
  return window.localStorage.getItem('crm-sidebar-collapsed') === 'true';
}
