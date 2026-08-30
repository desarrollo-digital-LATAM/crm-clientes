'use client';

import Link from 'next/link';
import { Building2, ChevronLeft, ChevronRight, LayoutDashboard, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Brand } from '../brand';

const links = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', Icon: Users },
  { href: '/clientes', label: 'Clientes', Icon: Building2 },
];

type User = { name: string | null; email: string };

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

  return (
    <aside className={`flex h-dvh w-full shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-[width] duration-200 ease-out ${collapsed ? 'w-[72px]' : 'w-[248px]'}`}>
      <div className={`relative flex min-h-[76px] items-center border-b border-[var(--sidebar-border)] ${collapsed ? 'justify-center px-1' : 'justify-between px-5'}`}>
        <Brand compact={collapsed} />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={`rounded-md p-2 text-slate-400 transition hover:bg-white/10 hover:text-white ${collapsed ? 'absolute right-1 top-1' : ''}`}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <nav aria-label="Navegación principal" className={`space-y-1 py-6 ${collapsed ? 'px-2' : 'px-3'}`}>
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
                <span role="tooltip" className="pointer-events-none absolute left-full z-20 ml-3 hidden whitespace-nowrap rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white shadow-lg group-hover:block group-focus-visible:block">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && user && (
        <div className="mt-auto border-t border-[var(--sidebar-border)] px-5 py-5">
          <p className="truncate text-sm font-medium text-white">{user.name || user.email}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{user.name ? user.email : 'Usuario interno'}</p>
        </div>
      )}
    </aside>
  );
}
