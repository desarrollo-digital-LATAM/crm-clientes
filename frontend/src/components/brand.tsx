import Image from 'next/image';

export function Brand({ compact = false, onClick, title }: { compact?: boolean; onClick?: () => void; title?: string }) {
  const content = (
    <div className={`flex min-w-0 items-center ${compact ? 'justify-center' : 'gap-3'}`} aria-label="Desarrollo Digital Latam">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
        <Image src="/Logo DesarrolloDigitalLatam.jpeg" alt="Logo Desarrollo Digital Latam" width={44} height={44} className="h-full w-full object-contain" priority />
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <strong className="block text-[15px] font-semibold tracking-tight">Desarrollo Digital</strong>
          <small className="block text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Latam</small>
        </span>
      )}
    </div>
  );
  return onClick ? <button type="button" onClick={onClick} title={title} className="rounded-lg text-left focus-visible:ring-2 focus-visible:ring-[var(--primary)]">{content}</button> : content;
}
