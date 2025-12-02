import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Essaye la vue agrégée côté base pour fiabilité
  const { data: viewData } = await supabase
    .from('vente_vendeur_kpi_mois')
    .select('mois,total_ht');
  let rows: { mois: string; total_ht: number }[] = [];
  if (Array.isArray(viewData) && viewData.length) {
    rows = (viewData as any[]).map((r) => {
      const m = String(r.mois);
      const raw = r.total_ht;
      const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
      return { mois: m, total_ht: isFinite(n) ? n : 0 };
    }).sort((a, b) => a.mois.localeCompare(b.mois));
  } else {
    // Fallback: calcul par bornes
    const { data } = await supabase
      .from('vente_vendeur')
      .select('date_facture')
      .order('date_facture', { ascending: true })
      .range(0, 99999);
    const monthsSet = new Set<string>();
    if (Array.isArray(data)) {
      for (const r of data as any[]) {
        const s = String(r.date_facture ?? '').slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(s)) monthsSet.add(s);
      }
    }
    function rangeFromMonth(mois: string) {
      const [y, m] = mois.split('-').map((v) => parseInt(v, 10));
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      const s = start.toISOString().slice(0, 10);
      const e = end.toISOString().slice(0, 10);
      return { s, e };
    }
    const months = Array.from(monthsSet).sort((a, b) => a.localeCompare(b));
    for (const mois of months) {
      const { s, e } = rangeFromMonth(mois);
      const { data: lines } = await supabase
        .from('vente_vendeur')
        .select('total_ht')
        .gte('date_facture', s)
        .lt('date_facture', e)
        .range(0, 99999);
      let sum = 0;
      if (Array.isArray(lines)) {
        for (const r of lines as any[]) {
          const raw = r.total_ht;
          const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
          if (isFinite(n)) sum += n;
        }
      }
      rows.push({ mois, total_ht: sum });
    }
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
        <h1 className="title">KPI Ventes NV (nouveau)</h1>
        <p className="subtitle">Total HT par mois (source: vente_vendeur).</p>
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
