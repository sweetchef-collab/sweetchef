import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import FinancialCharts from '../_components/FinancialCharts';

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

  const { data: metricsData } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date', { ascending: true });

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
  const last = months.length ? months[months.length - 1] : null;
  const prev = months.length > 1 ? months[months.length - 2] : null;
  const deltaHT = last ? Math.round(last.total_ht - (prev?.total_ht || 0)) : 0;
  const deltaPct = last && prev && prev.total_ht ? Math.round((last.total_ht - prev.total_ht) / prev.total_ht * 100) : null;

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
        <div style={{ display:'flex', gap: 8 }}>
          <a className="btn secondary" href="/api/logout">Déconnexion</a>
        </div>
      </div>
      <div className="panel">
        <h1 className="title">Dashboard — Icham</h1>
        <p className="subtitle">Vue synthétique et accès rapide aux pages dédiées.</p>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-label">Ventes</div><div className="kpi-value">{ventes}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total HT</div><div className="kpi-value">{totalHT.toLocaleString('fr-FR')}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total TTC</div><div className="kpi-value">{totalTTC.toLocaleString('fr-FR')}</div></div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="section">
            <div className="subtitle">Indicateurs du mois</div>
            <div className="kpi-cards">
              <div className="kpi-card"><div className="kpi-label">Mois</div><div className="kpi-value">{last?.mois ?? '—'}</div></div>
              <div className="kpi-card"><div className="kpi-label">Ventes</div><div className="kpi-value">{last?.ventes ?? 0}</div></div>
              <div className="kpi-card"><div className="kpi-label">HT</div><div className="kpi-value">{(last?.total_ht ?? 0).toLocaleString('fr-FR')}</div></div>
              <div className="kpi-card"><div className="kpi-label">TTC</div><div className="kpi-value">{(last?.total_ttc ?? 0).toLocaleString('fr-FR')}</div></div>
            </div>
          </div>
          <div className="section">
            <div className="subtitle">Variation vs mois précédent</div>
            <div className="kpi-cards">
              <div className="kpi-card"><div className="kpi-label">HT Δ</div><div className="kpi-value">{deltaHT.toLocaleString('fr-FR')}</div></div>
              <div className="kpi-card"><div className="kpi-label">HT Δ %</div><div className="kpi-value">{deltaPct != null ? `${deltaPct}%` : '—'}</div></div>
              <div className="kpi-card"><div className="kpi-label">Mois précédent</div><div className="kpi-value">{prev?.mois ?? '—'}</div></div>
            </div>
          </div>
        </div>

        <div className="section" style={{ marginTop: 8 }}>
          <div className="subtitle">Accès pages</div>
          <div className="tiles">
            <Link className="tile" href="/icham/graphique"><div className="tile-icon">📉</div><div className="tile-title">Graphique</div><div className="tile-desc">Courbe HT (12 mois)</div></Link>
            <Link className="tile" href="/icham/clients"><div className="tile-icon">👥</div><div className="tile-title">Tous les clients</div><div className="tile-desc">Liste complète (client_vendeur)</div></Link>
            <Link className="tile" href="/icham/infos"><div className="tile-icon">🗂️</div><div className="tile-title">Infos achats</div><div className="tile-desc">Derniers achats et totaux</div></Link>
          </div>
        </div>

        <div className="section" style={{ marginTop: 8 }}>
          <div className="subtitle">Accès pôle</div>
          <div className="tiles">
            <Link className="tile" href="/pole/ICHAM"><div className="tile-icon">🟧</div><div className="tile-title">Pôle — Icham</div></Link>
            <Link className="tile" href="/pole/TERRAIN"><div className="tile-icon">🟦</div><div className="tile-title">Pôle — Terrain</div></Link>
            <Link className="tile" href="/pole/TELEVENTE"><div className="tile-icon">🟩</div><div className="tile-title">Pôle — Télévente</div></Link>
            <Link className="tile" href="/pole/AUTRE"><div className="tile-icon">🟪</div><div className="tile-title">Pôle — Autre</div></Link>
          </div>
        </div>

        <FinancialCharts data={metricsData || []} />
      </div>
    </div>
  );
}
