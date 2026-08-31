'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../theme/theme-toggle';
import LogoutButton from '../../app/dashboard/logout-button';
import { NotificationBell } from '../notifications/notification-bell';

export function AppHeader({ user, onMenu }: { user: { name: string | null; email: string }; onMenu: () => void }) {
  const pathname = usePathname();
  const title = pathname.startsWith('/leads') ? 'Leads' : pathname.startsWith('/clientes') ? 'Clientes' : pathname.startsWith('/notificaciones') ? 'Notificaciones' : 'Dashboard';

  return (
    <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-5 sm:px-10">
      <button type="button" onClick={onMenu} className="rounded-md p-2.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] lg:hidden" aria-label="Abrir menú">
        <Menu size={21} />
      </button>
      <div className="min-w-0">
        <p className="truncate text-[17px] font-semibold tracking-tight">{title}</p>
        <p className="hidden text-sm text-[var(--muted-foreground)] sm:block">CRM Clientes · Gestión comercial</p>
      </div>
      <div className="ml-auto flex items-center gap-3 sm:gap-5">
        <NotificationBell />
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <p className="max-w-48 truncate text-sm font-medium">{user.name || user.email}</p>
          <p className="max-w-48 truncate text-sm text-[var(--muted-foreground)]">{user.name ? user.email : 'Usuario interno'}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
