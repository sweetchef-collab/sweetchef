import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Essai 1: vue mensuelle si disponible
  const { data: byMonthView } = await supabase
    .from('sales_clean_kpi_mois')
    .select('annee,mois,total_ht_mois')
    .order('annee', { ascending: true })
    .order('mois', { ascending: true });

  let rows: { mois: string; total_ht: number }[] = [];
  if (Array.isArray(byMonthView) && byMonthView.length) {
    rows = (byMonthView as any[]).map((r) => ({
      mois: `${String(r.annee)}-${String(r.mois).padStart(2, '0')}`,
      total_ht: typeof r.total_ht_mois === 'number'
        ? r.total_ht_mois
        : parseFloat(String((r as any).total_ht_mois ?? '').trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0,
    }));
  } else {
    // Fallback: pagination + agrégation côté client
    const byMonth = new Map<string, number>();
    for (let offset = 0; offset < 1000000; offset += 1000) {
      const { data: chunk } = await supabase
        .from('sales_clean')
        .select('date_facture,total_ht')
        .order('id', { ascending: true })
        .range(offset, offset + 999);
      if (!Array.isArray(chunk) || chunk.length === 0) break;
      for (const r of chunk as any[]) {
        const s = String(r.date_facture ?? '').slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(s)) {
          const raw = r.total_ht;
          const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
          const cur = byMonth.get(s) ?? 0;
          byMonth.set(s, cur + (isFinite(n) ? n : 0));
        }
      }
      if (chunk.length < 1000) break;
    }
    const months = Array.from(byMonth.keys()).sort((a, b) => a.localeCompare(b));
    rows = months.map((mois) => ({ mois, total_ht: byMonth.get(mois) ?? 0 }));
  }

  const grandTotal = rows.reduce((s, r) => s + r.total_ht, 0);

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">KPI Ventes NV</h1>
        <p className="subtitle">Total HT par mois (source: sales_clean).</p>
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-label">Total général HT</div>
            <div className="kpi-value">{grandTotal.toLocaleString('fr-FR')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Mois</div>
            <div className="kpi-value">{rows.length}</div>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Mois</th>
              <th style={{ textAlign: 'right' }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.mois}>
                <td><Link className="cell-link" href={`/kpi-sans-vendeur/${r.mois}`}>{r.mois}</Link></td>
                <td style={{ textAlign: 'right' }}>{r.total_ht.toLocaleString('fr-FR')}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={2}>
                  <div className="alert">Aucune donnée disponible.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
