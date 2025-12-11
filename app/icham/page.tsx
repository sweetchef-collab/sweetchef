import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

function parseAmount(raw: any) {
  if (typeof raw === 'number') return isFinite(raw) ? raw : 0;
  if (raw == null) return 0;
  const s = String(raw).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
function toDateSafe(raw: any): Date | null {
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { const [dd,mm,yyyy] = s.split('/').map(v=>parseInt(v,10)); const d = new Date(Date.UTC(yyyy, mm-1, dd)); return isNaN(d.getTime()) ? null : d; }
    const d = new Date(s); return isNaN(d.getTime()) ? null : d;
  }
  if (raw) { const d = new Date(raw); return isNaN(d.getTime()) ? null : d; }
  return null;
}
function monthFrom(v: any) { const d = toDateSafe(v); return d ? d.toISOString().slice(0,7) : null; }

export default async function Page() {
  const ck = cookies();
  const role = ck.get('sc_role')?.value || ck.get('sc_admin')?.value === '1' ? 'admin' : null;
  const isIcham = ck.get('sc_role')?.value === 'icham';
  if (!isIcham && role !== 'admin') {
    return (
      <div className="container"><div className="panel"><div className="alert">Non autorisé</div></div></div>
    );
  }

  let data: any[] = [];
  for (let offset = 0; offset < 1000000; offset += 1000) {
    const { data: chunk } = await supabase
      .from('vente_vendeur')
      .select('date_facture,total_ht,total_ttc,client,code_client,vendeur')
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    const filtered = (chunk as any[]).filter((r) => String(r.vendeur ?? '').trim().toUpperCase() === 'ICHAM');
    if (filtered.length) data = data.concat(filtered);
    if (chunk.length < 1000) break;
  }

  const byMonth = new Map<string, { total_ht: number; total_ttc: number; ventes: number }>();
  const byClient = new Map<string, { id: string; client: string; ventes: number; total_ht: number }>();
  let totalHT = 0; let totalTTC = 0; let ventes = 0;

  for (const r of data as any[]) {
    const m = monthFrom(r.date_facture);
    const ht = parseAmount(r.total_ht);
    const ttc = parseAmount(r.total_ttc);
    const key = String(r.code_client ?? r.client ?? '');
    const name = String(r.client ?? '').trim();
    if (m) {
      const cur = byMonth.get(m) ?? { total_ht: 0, total_ttc: 0, ventes: 0 };
      cur.total_ht += ht; cur.total_ttc += ttc; cur.ventes += 1; byMonth.set(m, cur);
    }
    if (key) {
      const cc = byClient.get(key) ?? { id: key, client: name || key, ventes: 0, total_ht: 0 };
      cc.ventes += 1; cc.total_ht += ht; byClient.set(key, cc);
    }
    totalHT += ht; totalTTC += ttc; ventes += 1;
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
        <h1 className="title">Espace — Icham</h1>
        <p className="subtitle">Vue dédiée aux ventes d'Icham, avec accès aux pages pôle.</p>
        <div className="tiles" style={{ marginBottom: 12 }}>
          <Link className="tile" href="/icham/graphique"><div className="tile-icon">📉</div><div className="tile-title">Graphique — Icham</div><div className="tile-desc">Courbe HT (12 mois)</div></Link>
          <Link className="tile" href="/icham/infos"><div className="tile-icon">🗂️</div><div className="tile-title">Infos — Icham</div><div className="tile-desc">Liste clients et derniers achats</div></Link>
        </div>
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
                  <tr key={i}><td><Link className="cell-link" href={`/client/${encodeURIComponent(c.id)}`}>{c.client}</Link></td><td>{c.ventes}</td><td style={{ textAlign:'right' }}>{c.total_ht.toLocaleString('fr-FR')}</td></tr>
                ))}
                {!topClients.length && (<tr><td colSpan={3}><div className="alert">Aucune donnée.</div></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section" style={{ marginTop: 16 }}>
          <div className="subtitle">Accès pôle</div>
          <div className="tiles">
            <Link className="tile" href="/pole/ICHAM"><div className="tile-icon">🟧</div><div className="tile-title">Pôle — Icham</div></Link>
            <Link className="tile" href="/pole/TERRAIN"><div className="tile-icon">🟦</div><div className="tile-title">Pôle — Terrain</div></Link>
            <Link className="tile" href="/pole/TELEVENTE"><div className="tile-icon">🟩</div><div className="tile-title">Pôle — Télévente</div></Link>
            <Link className="tile" href="/pole/AUTRE"><div className="tile-icon">🟪</div><div className="tile-title">Pôle — Autre</div></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
