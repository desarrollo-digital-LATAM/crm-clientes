import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = [
  '/dashboard',
  '/leads',
  '/clientes',
  '/recordatorios',
  '/notificaciones',
];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === '/login';
  if (!isProtectedPath(pathname) && !isLogin) return NextResponse.next();

  const token = request.cookies.get('crm_session')?.value;
  let authenticated = false;

  if (token) {
    try {
      const response = await fetch(new URL('/api/auth/me', request.nextUrl.origin), {
        headers: { cookie: `crm_session=${encodeURIComponent(token)}` },
        cache: 'no-store',
      });
      authenticated = response.ok;
    } catch {
      authenticated = false;
    }
  }

  if (isLogin && authenticated) return NextResponse.redirect(new URL('/dashboard', request.url));
  if (!authenticated) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/leads/:path*', '/clientes/:path*', '/recordatorios/:path*', '/notificaciones/:path*'],
};
