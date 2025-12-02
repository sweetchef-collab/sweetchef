import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

function monthRange(label?: string) {
  const now = new Date();
  const y = label ? parseInt(label.slice(0, 4), 10) : now.getUTCFullYear();
  const m = label ? parseInt(label.slice(5, 7), 10) - 1 : now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  const s = start.toISOString().slice(0, 10);
  const e = end.toISOString().slice(0, 10);
  return { s, e };
}

function sanitize(v: any) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes('"') || s.includes(';') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function fmtNumFR(n: any) {
  if (typeof n === 'number') return n.toString().replace(/\./g, ',');
  if (n == null) return '';
  const s = String(n).trim().replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const f = parseFloat(s);
  if (!isFinite(f)) return '';
  return f.toString().replace(/\./g, ',');
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mois = url.searchParams.get('mois') || null;
    const { s, e } = monthRange(mois || undefined);
    const { data, error } = await supabase
      .from('vente_vendeur')
      .select('date_facture,code_client,client,ville,vendeur,total_ht,total_ttc,num_facture')
      .gte('date_facture', s)
      .lt('date_facture', e)
      .range(0, 99999);
    if (error) {
      return new NextResponse(error.message, { status: 500 });
    }
    const header = ['date_facture','code_client','client','ville','vendeur','num_facture','total_ht','total_ttc'];
    const rows = [header.join(';')];
    for (const r of (data || []) as any[]) {
      rows.push([
        sanitize(r.date_facture),
        sanitize(r.code_client),
        sanitize(r.client),
        sanitize(r.ville),
        sanitize(r.vendeur),
        sanitize(r.num_facture),
        fmtNumFR(r.total_ht),
        fmtNumFR(r.total_ttc),
      ].join(';'));
    }
    const csv = rows.join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vente_vendeur_${mois ?? s.slice(0,7)}.csv"`,
      }
    });
  } catch (e: any) {
    return new NextResponse(e.message ?? 'Erreur', { status: 500 });
  }
}

