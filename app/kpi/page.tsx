import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import KpiTable from '@/components/KpiTable';

export default async function Page() {
  const { data, error } = await supabase
    .from('sales_kpi_by_family')
    .select('famille,total');

  const rows = Array.isArray(data)
    ? (data as any[]).map((r) => {
        const fam = r.famille ?? 'Non spécifiée';
        const raw = r.total;
        const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
        return { fam, total: isFinite(n) ? n : 0 };
      }).filter((r) => r.total > 0)
    : [];

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const max = rows.reduce((m, r) => Math.max(m, r.total), 0) || 1;
  const top = rows.slice(0, 10);


  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">KPI Ventes</h1>
        <p className="subtitle">Total des ventes par famille de clients.</p>
        <div className="kpi-cards">
          <div className="kpi-card">
            <div className="kpi-label">Total général</div>
            <div className="kpi-value">{grandTotal.toLocaleString('fr-FR')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Familles</div>
            <div className="kpi-value">{rows.length}</div>
          </div>
        </div>
        <div className="chart">
          {top.map((r) => (
            <div className="chart-row" key={r.fam}>
              <div className="chart-label">{r.fam}</div>
              <div className="chart-bar">
                <div className="chart-bar-fill" style={{ width: `${Math.round((r.total / max) * 100)}%` }} />
              </div>
              <div className="chart-value">{r.total.toLocaleString('fr-FR')}</div>
            </div>
          ))}
          {!top.length && <div className="alert">Aucune donnée à afficher.</div>}
        </div>
        <KpiTable rows={rows} />
      </div>
    </div>
  );
}
