import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ status: 'error', message: 'Variables d\'environnement manquantes' }, { status: 500 });
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('daily_metrics').select('count', { count: 'exact', head: true });
    
    if (error) {
      return NextResponse.json({ status: 'error', message: error.message, details: error }, { status: 500 });
    }
    
    return NextResponse.json({ status: 'success', message: 'Connexion réussie', url_used: url });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.message }, { status: 500 });
  }
}