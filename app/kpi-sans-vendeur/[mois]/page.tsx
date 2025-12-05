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
  const all: any[] = [];
  for (let offset = 0; offset < 1000000; offset += 1000) {
    const { data: chunk } = await supabase
      .from('sales_clean')
      .select('date_facture,total_ht,total_ttc,code_client,client')
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    all.push(...(chunk as any[]));
    if (chunk.length < 1000) break;
  }
  const { data: clients } = await supabase
    .from('client_vendeur')
    .select('code_client,client,vendeur')
    .range(0, 999999);

  const byDay = new Map<string, { count: number; total_ht: number; total_ttc: number }>();
  const byClient = new Map<string, { client: string; total_ht: number; total_ttc: number; count: number }>();
  const byVendor = new Map<string, { vendeur: string; total_ht: number; total_ttc: number; count: number }>();
  let totalHT = 0; let totalTTC = 0; let ventes = 0;

  const vendMap = new Map<string, { client?: string; vendeur?: string }>();
  if (Array.isArray(clients)) {
    for (const c of clients as any[]) {
      const code = String(c.code_client ?? '').trim().toUpperCase();
      if (code) vendMap.set(code, { client: String(c.client ?? c.societe ?? ''), vendeur: String(c.vendeur ?? '') });
    }
  }

  if (Array.isArray(all)) {
    for (const r of all as any[]) {
      const raw = r.date_facture;
      let d: string | null = null;
      if (typeof raw === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) d = raw.slice(0, 10);
        else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
          const [dd, mm, yyyy] = raw.split('/').map((v: any) => parseInt(v, 10));
          const k = new Date(Date.UTC(yyyy, mm - 1, dd)).toISOString().slice(0, 10);
          d = k;
        }
      } else if (raw) {
        const k = new Date(raw).toISOString().slice(0, 10);
        d = k;
      }
      if (!(d && d >= s && d < e)) continue;
      const htRaw = r.total_ht; const ttcRaw = r.total_ttc;
      const ht = typeof htRaw === 'number' ? htRaw : parseFloat(String(htRaw ?? '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
      const ttc = typeof ttcRaw === 'number' ? ttcRaw : parseFloat(String(ttcRaw ?? '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
      const htVal = isFinite(ht) ? ht : 0; const ttcVal = isFinite(ttc) ? ttc : 0;
      if (d) {
        const cur = byDay.get(d) ?? { count: 0, total_ht: 0, total_ttc: 0 };
        cur.count += 1; cur.total_ht += htVal; cur.total_ttc += ttcVal;
        byDay.set(d, cur);
      }
      const key = String(r.code_client ?? r.client ?? '');
      if (key) {
        const cm = vendMap.get(String(r.code_client ?? '').trim().toUpperCase());
        const cur = byClient.get(key) ?? { client: String(cm?.client ?? r.client ?? key), total_ht: 0, total_ttc: 0, count: 0 };
        cur.count += 1; cur.total_ht += htVal; cur.total_ttc += ttcVal;
        byClient.set(key, cur);
      }
      const cm2 = vendMap.get(String(r.code_client ?? '').trim().toUpperCase());
      const vend = String(cm2?.vendeur ?? '').trim();
      if (vend) {
        const curV = byVendor.get(vend) ?? { vendeur: vend, total_ht: 0, total_ttc: 0, count: 0 };
        curV.count += 1; curV.total_ht += htVal; curV.total_ttc += ttcVal;
        byVendor.set(vend, curV);
      }
      ventes += 1; totalHT += htVal; totalTTC += ttcVal;
    }
  }

  const days = Array.from(byDay.entries()).map(([d, v]) => ({ d, ...v }))
    .sort((a, b) => a.d.localeCompare(b.d));
  const topClients = Array.from(byClient.values())
    .sort((a, b) => b.total_ht - a.total_ht).slice(0, 10);
  const vendors = Array.from(byVendor.values())
    .sort((a, b) => b.total_ht - a.total_ht);
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
                {topClients.map((c, i) => (
                  <tr key={i}><td>{c.client}</td><td>{c.count}</td><td style={{ textAlign:'right' }}>{c.total_ht.toLocaleString('fr-FR')}</td></tr>
                ))}
                {!topClients.length && (<tr><td colSpan={3}><div className="alert">Aucune donnée.</div></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="section">
            <div className="subtitle">Vendeurs (HT)</div>
            <table className="table">
              <thead><tr><th>Vendeur</th><th>Ventes</th><th style={{ textAlign:'right' }}>Total HT</th></tr></thead>
              <tbody>
                {vendors.map((v, i) => (
                  <tr key={i}><td><Link className="cell-link" href={`/vendeur/${encodeURIComponent(v.vendeur)}`}>{v.vendeur}</Link></td><td>{v.count}</td><td style={{ textAlign:'right' }}>{v.total_ht.toLocaleString('fr-FR')}</td></tr>
                ))}
                {!vendors.length && (<tr><td colSpan={3}><div className="alert">Aucune donnée.</div></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
