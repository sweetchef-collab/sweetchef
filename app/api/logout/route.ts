import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL('/login', request.url);
  const res = NextResponse.redirect(url);
  res.cookies.set('sc_admin', '', { httpOnly: true, sameSite: 'lax', maxAge: 0, path: '/' });
  return res;
}
