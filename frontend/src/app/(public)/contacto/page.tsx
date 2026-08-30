'use client';

import Image from 'next/image';
import { PublicLeadForm } from '../../../components/public/public-lead-form';
import { Brand } from '../../../components/brand';

export default function ContactoPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-5 py-5 sm:px-8">
          <Brand />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-8">
        <section className="w-full max-w-xl">
          <div className="text-center mb-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Image
                src="/Logo DesarrolloDigitalLatam.jpeg"
                alt="Logo Desarrollo Digital Latam"
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">Cuéntanos qué necesitas</h1>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Completa tus datos y cuéntanos brevemente qué solución buscas.
              Nos pondremos en contacto contigo.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm">
            <PublicLeadForm />
          </div>
        </section>
      </div>
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-center text-sm text-[var(--muted-foreground)]">
        <p>Desarrollo Digital Latam &copy; {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}