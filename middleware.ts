import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/api/logout',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    || pathname.startsWith('/_next')
    || pathname.startsWith('/images')
    || pathname.startsWith('/favicon');

  const roleCookie = req.cookies.get('sc_role');
  const adminCookie = req.cookies.get('sc_admin');
  const authed = !!roleCookie?.value || adminCookie?.value === '1';

  if (pathname === '/') {
    if (roleCookie?.value === 'icham') {
      const url = req.nextUrl.clone();
      url.pathname = '/icham';
      return NextResponse.redirect(url);
    }
    if (roleCookie?.value === 'ibrahim') {
        const url = req.nextUrl.clone();
        url.pathname = '/ibrahim';
        return NextResponse.redirect(url);
    }
    if (roleCookie?.value === 'data_entry') {
      const url = req.nextUrl.clone();
      url.pathname = '/data-entry';
      return NextResponse.redirect(url);
    }
  }

  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  if (roleCookie?.value) {
    res.headers.set('x-sc-role', roleCookie.value);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next|images|favicon|static).*)'],
};
