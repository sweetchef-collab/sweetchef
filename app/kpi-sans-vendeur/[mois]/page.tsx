import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

function rangeFromMonth(mois: string) {
  const [y, m] = mois.split('-').map((v) => parseInt(v, 10));
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const s = start.toISOString().slice(0, 10);
  const e = end.toISOString().slice(0, 10);
  return { s, e };
}

export default async function Page({ params }: { params: { mois: string } }) {
  const mois = params.mois;
  const { s, e } = rangeFromMonth(mois);
  const { data, error } = await supabase
    .from('sales_nv')
    .select('date_facture,total_ht,total_ttc,code_client,client')
    .gte('date_facture', s)
    .lt('date_facture', e);

  const byDay = new Map<string, { count: number; total_ht: number; total_ttc: number }>();
  const byClient = new Map<string, { client: string; total_ht: number; total_ttc: number; count: number }>();
  let totalHT = 0; let totalTTC = 0; let ventes = 0;

  if (Array.isArray(data)) {
    for (const r of data as any[]) {
      const d = r.date_facture ? String(r.date_facture).slice(0, 10) : null;
      const htRaw = r.total_ht; const ttcRaw = r.total_ttc;
      const ht = typeof htRaw === 'number' ? htRaw : parseFloat(String(htRaw ?? '').replace(',', '.'));
      const ttc = typeof ttcRaw === 'number' ? ttcRaw : parseFloat(String(ttcRaw ?? '').replace(',', '.'));
      const htVal = isFinite(ht) ? ht : 0; const ttcVal = isFinite(ttc) ? ttc : 0;
      if (d) {
        const cur = byDay.get(d) ?? { count: 0, total_ht: 0, total_ttc: 0 };
        cur.count += 1; cur.total_ht += htVal; cur.total_ttc += ttcVal;
        byDay.set(d, cur);
      }
      const key = String(r.code_client ?? r.client ?? '');
      if (key) {
        const cur = byClient.get(key) ?? { client: String(r.client ?? key), total_ht: 0, total_ttc: 0, count: 0 };
        cur.count += 1; cur.total_ht += htVal; cur.total_ttc += ttcVal;
        byClient.set(key, cur);
      }
      ventes += 1; totalHT += htVal; totalTTC += ttcVal;
    }
  }

  const days = Array.from(byDay.entries()).map(([d, v]) => ({ d, ...v }))
    .sort((a, b) => a.d.localeCompare(b.d));
  const clients = Array.from(byClient.values())
    .sort((a, b) => b.total_ht - a.total_ht).slice(0, 10);
  const joursActifs = days.length;

  const order = [1,2,3,4,5];
  const names = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const byWeek = new Map<number, { count: number; total_ht: number }>();
  for (const r of days) {
    const d = new Date(r.d + 'T00:00:00Z');
    const w = d.getUTCDay();
    const cur = byWeek.get(w) ?? { count: 0, total_ht: 0 };
    cur.count += r.count; cur.total_ht += r.total_ht;
    byWeek.set(w, cur);
  }
  const weekRows = order.map((w) => ({ w, name: names[w], ...(byWeek.get(w) ?? { count: 0, total_ht: 0 }) }));

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Ventes NV – {mois}</h1>
        <p className="subtitle">Analyse du mois: jours actifs, nombre de ventes, total HT/TTC et top clients.</p>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-label">Ventes</div><div className="kpi-value">{ventes}</div></div>
          <div className="kpi-card"><div className="kpi-label">Jours actifs</div><div className="kpi-value">{joursActifs}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total HT</div><div className="kpi-value">{totalHT.toLocaleString('fr-FR')}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total TTC</div><div className="kpi-value">{totalTTC.toLocaleString('fr-FR')}</div></div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="section">
            <div className="subtitle">Top clients (HT)</div>
            <table className="table">
              <thead><tr><th>Client</th><th>Ventes</th><th style={{ textAlign:'right' }}>Total HT</th></tr></thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={i}><td>{c.client}</td><td>{c.count}</td><td style={{ textAlign:'right' }}>{c.total_ht.toLocaleString('fr-FR')}</td></tr>
                ))}
                {!clients.length && (<tr><td colSpan={3}><div className="alert">Aucune donnée.</div></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="section">
            <div className="subtitle">Par jour de semaine</div>
            <table className="table">
              <thead><tr><th>Jour</th><th>Ventes</th><th style={{ textAlign:'right' }}>Total HT</th></tr></thead>
              <tbody>
                {weekRows.map((r) => (
                  <tr key={r.w}><td>{r.name}</td><td>{r.count}</td><td style={{ textAlign:'right' }}>{r.total_ht.toLocaleString('fr-FR')}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
