import type { ReactNode } from 'react';
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>Contacto - Desarrollo Digital Latam</title>
        <meta name="description" content="Cuéntanos qué necesitas. Completa tus datos y te contactaremos." />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}