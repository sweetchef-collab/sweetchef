import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Identifiants manquants' }, { status: 400 });
    }
    const uname = String(username).trim().toLowerCase();
    const pwd = String(password).trim().toLowerCase();
    const isIcham = uname === 'icham' && pwd === 'icham2025';

    if (isIcham) {
      const res = NextResponse.json({ ok: true, role: 'icham' });
      res.cookies.set('sc_role', 'icham', { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
      return res;
    }

    const { data, error } = await supabase.rpc('verify_user', { p_username: username, p_password: password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, role: 'admin' });
    res.cookies.set('sc_role', 'admin', { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
    res.cookies.set('sc_admin', '1', { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur interne' }, { status: 500 });
  }
}
