import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const ck = cookies();
    if (ck.get('sc_admin')?.value !== '1') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const { error } = await supabase.rpc('refresh_vente_vendeur');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { count, error: cntErr } = await supabase
      .from('vente_vendeur')
      .select('*', { count: 'exact', head: true });
    if (cntErr) {
      return NextResponse.json({ error: cntErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, rows: count ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur interne' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Utilisez POST' }, { status: 405 });
}

