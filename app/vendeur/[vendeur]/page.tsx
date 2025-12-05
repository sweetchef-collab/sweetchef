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

export default async function Page({ params }: { params: { vendeur: string } }) {
  const vendeur = decodeURIComponent(params.vendeur);
  let data: any[] = [];
  for (let offset = 0; offset < 1000000; offset += 1000) {
    const { data: chunk } = await supabase
      .from('vente_vendeur')
      .select('date_facture,total_ht,total_ttc,client,code_client,vendeur')
      .range(offset, offset + 999);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    const vendKey = vendeur.trim().toUpperCase();
    const filtered = (chunk as any[]).filter((r) => String(r.vendeur ?? '').trim().toUpperCase() === vendKey);
    data = data.concat(filtered);
    if (chunk.length < 1000) break;
  }

  const byMonth = new Map<string, { total_ht: number; total_ttc: number; ventes: number }>();
  const byClient = new Map<string, { client: string; total_ht: number; ventes: number }>();
  let totalHT = 0; let totalTTC = 0; let ventes = 0;

  if (Array.isArray(data)) {
    for (const r of data as any[]) {
      const m = monthFrom(r.date_facture);
      const ht = parseAmount(r.total_ht);
      const ttc = parseAmount(r.total_ttc);
      if (m) {
        const cur = byMonth.get(m) ?? { total_ht: 0, total_ttc: 0, ventes: 0 };
        cur.total_ht += ht; cur.total_ttc += ttc; cur.ventes += 1;
        byMonth.set(m, cur);
      }
      const key = String(r.code_client ?? r.client ?? '');
      if (key) {
        const c = byClient.get(key) ?? { client: String(r.client ?? key), total_ht: 0, ventes: 0 };
        c.total_ht += ht; c.ventes += 1; byClient.set(key, c);
      }
      totalHT += ht; totalTTC += ttc; ventes += 1;
    }
  }

  const months = Array.from(byMonth.entries()).map(([mois, v]) => ({ mois, ...v }))
    .sort((a, b) => a.mois.localeCompare(b.mois));
  const topClients = Array.from(byClient.values()).sort((a, b) => b.total_ht - a.total_ht).slice(0, 20);

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Ventes par vendeur — {vendeur}</h1>
        <p className="subtitle">Total HT/TTC par mois et top clients.</p>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-label">Ventes</div><div className="kpi-value">{ventes}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total HT</div><div className="kpi-value">{totalHT.toLocaleString('fr-FR')}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total TTC</div><div className="kpi-value">{totalTTC.toLocaleString('fr-FR')}</div></div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="section">
            <div className="subtitle">Par mois</div>
            <table className="table">
              <thead><tr><th>Mois</th><th>Ventes</th><th style={{ textAlign:'right' }}>Total HT</th><th style={{ textAlign:'right' }}>Total TTC</th></tr></thead>
              <tbody>
                {months.map((m, i) => (
                  <tr key={i}><td>{m.mois}</td><td>{m.ventes}</td><td style={{ textAlign:'right' }}>{m.total_ht.toLocaleString('fr-FR')}</td><td style={{ textAlign:'right' }}>{m.total_ttc.toLocaleString('fr-FR')}</td></tr>
                ))}
                {!months.length && (<tr><td colSpan={4}><div className="alert">Aucune donnée.</div></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="section">
            <div className="subtitle">Top clients (HT)</div>
            <table className="table">
              <thead><tr><th>Client</th><th>Ventes</th><th style={{ textAlign:'right' }}>Total HT</th></tr></thead>
              <tbody>
                {topClients.map((c, i) => (
                  <tr key={i}><td>{c.client}</td><td>{c.ventes}</td><td style={{ textAlign:'right' }}>{c.total_ht.toLocaleString('fr-FR')}</td></tr>
                ))}
                {!topClients.length && (<tr><td colSpan={3}><div className="alert">Aucune donnée.</div></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
