'use client';

import Link from 'next/link';
import { Bell, Building2, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Settings, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Brand } from '../brand';

const links = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', Icon: Users },
  { href: '/clientes', label: 'Clientes', Icon: Building2 },
  { href: '/recordatorios', label: 'Recordatorios', Icon: Bell },
];

const settingsLinks = [{ href: '/usuarios', label: 'Usuarios', Icon: Settings }];

type User = { name: string | null; email: string; role?: 'ADMIN' | 'MEMBER' };

export function AppSidebar({
  onNavigate,
  collapsed = false,
  onToggle,
  user,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
  user?: User;
}) {
  const pathname = usePathname();

  function expandFromEmpty(event: React.MouseEvent<HTMLElement>) {
    if (!collapsed || !onToggle || isInteractiveTarget(event.target)) return;
    onToggle();
  }

  return (
    <aside onClick={expandFromEmpty} className={`relative flex h-dvh w-full shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-[width] duration-200 ease-out ${collapsed ? 'w-[80px]' : 'w-[248px]'}`}>
      <div className={`relative flex min-h-[76px] items-center border-b border-[var(--sidebar-border)] ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
        <Brand compact={collapsed} onClick={collapsed ? onToggle : undefined} title={collapsed ? 'Expandir barra lateral' : undefined} />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute -right-4 top-5 z-40 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            aria-expanded={!collapsed}
            aria-controls="crm-primary-navigation"
            title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      <nav id="crm-primary-navigation" aria-label="Navegación principal" className="space-y-1 px-3 py-6">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              className={`group relative flex min-h-11 items-center rounded-lg text-[15px] transition-colors ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} ${active ? 'bg-blue-500/15 font-semibold text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.9} />
              {!collapsed && label}
              {collapsed && (
                <span role="tooltip" className="pointer-events-none absolute left-full z-20 ml-3 hidden whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-lg group-hover:block group-focus-visible:block">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Configuración" className="mt-auto border-t border-[var(--sidebar-border)] px-3 py-5">
        {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Configuración</p>}
        {(user?.role === 'ADMIN' ? settingsLinks : []).map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} aria-label={collapsed ? label : undefined} className={`group relative flex min-h-11 items-center rounded-lg text-[15px] transition-colors ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} ${active ? 'bg-blue-500/15 font-semibold text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={19} strokeWidth={active ? 2.2 : 1.9} />{!collapsed && label}{collapsed && <span role="tooltip" className="pointer-events-none absolute left-full z-20 ml-3 hidden whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-lg group-hover:block group-focus-visible:block">{label}</span>}</Link>;
        })}
      </nav>

      {user && (
        <div className={`mt-auto border-t border-[var(--sidebar-border)] py-5 ${collapsed ? 'px-3' : 'px-5'}`}>
          {collapsed ? <div className="flex justify-center" title={`${user.name || user.email} · ${user.email}`}><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-200">{(user.name || user.email).slice(0, 1).toUpperCase()}</span></div> : <><p className="truncate text-sm font-medium text-white">{user.name || user.email}</p><p className="mt-1 truncate text-sm text-slate-400">{user.name ? user.email : 'Usuario interno'}</p></>}
        </div>
      )}
    </aside>
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a, button, input, select, textarea, [role="button"], [data-sidebar-interactive]'));
}
