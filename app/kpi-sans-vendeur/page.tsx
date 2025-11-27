import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data, error } = await supabase
    .from('sales_nv_kpi_month')
    .select('mois,total_ht');

  let rows = Array.isArray(data)
    ? (data as any[]).map((r) => {
        const m = r.mois;
        const raw = r.total_ht;
        const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
        return { mois: m, total_ht: isFinite(n) ? n : 0 };
      }).filter((r) => r.total_ht > 0)
    : [];

  if (!rows.length) {
    const fallback = await supabase.from('sales_nv').select('date_facture,total_ht');
    const map = new Map<string, number>();
    if (!fallback.error && Array.isArray(fallback.data)) {
      for (const r of fallback.data as any[]) {
        const d = r.date_facture ? String(r.date_facture).slice(0, 10) : null;
        const m = d ? `${d.slice(0, 4)}-${d.slice(5, 7)}` : null;
        const raw = r.total_ht;
        const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
        if (m && isFinite(n)) map.set(m, (map.get(m) ?? 0) + n);
      }
      rows = Array.from(map.entries()).map(([mois, total_ht]) => ({ mois, total_ht }))
        .sort((a, b) => a.mois.localeCompare(b.mois));
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
        <h1 className="title">KPI Ventes sans vendeur</h1>
        <p className="subtitle">Total HT par mois.</p>
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
