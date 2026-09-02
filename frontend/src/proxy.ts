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

async function validateSession(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const backendUrl = process.env.BACKEND_URL ?? request.nextUrl.origin;
    const response = await fetch(new URL('/api/auth/me', backendUrl), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    });

    return {
      authenticated: response.status === 200,
      invalid: response.status === 401 || response.status === 403,
    };
  } catch {
    return { authenticated: false, invalid: false };
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === '/login';
  if (!isProtectedPath(pathname) && !isLogin) return NextResponse.next();

  const hasSession = request.cookies.has('crm_session');
  if (!hasSession) {
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL('/login', request.url));
  }

  const { authenticated, invalid } = await validateSession(request);

  if (isLogin && authenticated) return NextResponse.redirect(new URL('/dashboard', request.url));
  if (isLogin) {
    const response = NextResponse.next();
    if (invalid) response.cookies.delete('crm_session');
    return response;
  }

  if (authenticated) return NextResponse.next();

  const response = NextResponse.redirect(new URL('/login', request.url));
  if (invalid) response.cookies.delete('crm_session');
  return response;
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/leads/:path*', '/clientes/:path*', '/recordatorios/:path*', '/notificaciones/:path*'],
};
