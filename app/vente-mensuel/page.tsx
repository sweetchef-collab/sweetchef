import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

function parseAmount(raw: any) {
  if (typeof raw === 'number') return isFinite(raw) ? raw : 0;
  if (raw == null) return 0;
  const s = String(raw).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function monthFrom(dv: any) {
  if (typeof dv === 'string') {
    const s = dv.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 7);
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 7);
    return null;
  }
  if (dv) {
    const d = new Date(dv);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 7);
  }
  return null;
}

export default async function Page() {
  const { data } = await supabase.from('vente_vendeur').select('date_facture,total_ht');
  const monthsSet = new Set<string>();
  if (Array.isArray(data)) {
    for (const r of data as any[]) {
      const m = monthFrom(r.date_facture);
      if (m) monthsSet.add(m);
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
  const rows = months.map((mois) => {
    const { s, e } = rangeFromMonth(mois);
    let sum = 0;
    for (const r of (data || []) as any[]) {
      const dv = r.date_facture ? String(r.date_facture).slice(0, 10) : null;
      if (dv && dv >= s && dv < e) sum += parseAmount(r.total_ht);
    }
    return { mois, total_ht: sum };
  });
  const grandTotal = rows.reduce((s, r) => s + r.total_ht, 0);

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Vente mensuel</h1>
        <p className="subtitle">Total HT par mois à partir de `vente_vendeur`.</p>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-label">Total général HT</div><div className="kpi-value">{grandTotal.toLocaleString('fr-FR')}</div></div>
          <div className="kpi-card"><div className="kpi-label">Mois</div><div className="kpi-value">{rows.length}</div></div>
        </div>
        <table className="table">
          <thead><tr><th>Mois</th><th style={{ textAlign:'right' }}>Total HT</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.mois}><td>{r.mois}</td><td style={{ textAlign:'right' }}>{r.total_ht.toLocaleString('fr-FR')}</td></tr>
            ))}
            {!rows.length && (<tr><td colSpan={2}><div className="alert">Aucune donnée.</div></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
