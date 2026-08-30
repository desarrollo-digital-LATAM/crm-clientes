'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers';
import { useSyncExternalStore } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  if (!mounted) return <div className="h-9 w-28" />;
  return <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1" aria-label="Tema">
    {([['light', Sun, 'Claro'], ['dark', Moon, 'Oscuro'], ['system', Monitor, 'Sistema']] as const).map(([value, Icon, label]) => <button key={value} type="button" title={label} aria-label={label} onClick={() => setTheme(value)} className={`rounded-md p-1.5 ${theme === value ? 'bg-[var(--muted)] text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}><Icon size={15} /></button>)}
  </div>;
}
