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
  const d = toDateSafe(dv);
  return d ? d.toISOString().slice(0, 7) : null;
}

function normalizeCode(v: any) { return String(v ?? '').trim().toUpperCase(); }
function normalizeName(v: any) { return String(v ?? '').replace(/\s+/g, ' ').trim().toUpperCase(); }

function toDateSafe(raw: any): Date | null {
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split('/').map((v) => parseInt(v, 10));
      const d = new Date(Date.UTC(yyyy, mm - 1, dd));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  if (raw) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export default async function Page({ params }: { params: { id: string } }) {
  const idRaw = decodeURIComponent(params.id);
  const codeKey = normalizeCode(idRaw);
  const nameKey = normalizeName(idRaw);

  let data: any[] = [];
  for (let offset = 0; offset < 1000000; offset += 1000) {
    const { data: chunk } = await supabase
      .from('vente_vendeur')
      .select('date_facture,total_ht,total_ttc,client,code_client,vendeur,num_facture')
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    const filtered = (chunk as any[]).filter((r) => {
      const code = normalizeCode(r.code_client);
      const name = normalizeName(r.client);
      return (!!code && code === codeKey) || (!!name && name === nameKey);
    });
    if (filtered.length) data = data.concat(filtered);
    if (chunk.length < 1000) break;
  }

  const byMonth = new Map<string, { total_ht: number; total_ttc: number; ventes: number }>();
  const byVend = new Map<string, { vendeur: string; ventes: number; total_ht: number }>();
  let totalHT = 0; let totalTTC = 0; let ventes = 0;
  let clientName: string | null = null;
  let firstDate: string | null = null; let lastDate: string | null = null;

  const dates: string[] = [];
  if (Array.isArray(data)) {
    for (const r of data as any[]) {
      const m = monthFrom(r.date_facture);
      const ht = parseAmount(r.total_ht);
      const ttc = parseAmount(r.total_ttc);
      const vend = String(r.vendeur ?? '').trim();
      const name = String(r.client ?? '').trim();
      const dStr = (() => {
        const dv = r.date_facture;
        if (typeof dv === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dv)) return dv.slice(0,10);
        const d = new Date(dv);
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0,10);
      })();
      if (dStr) dates.push(dStr);
      if (clientName == null && name) clientName = name;

      if (m) {
        const cur = byMonth.get(m) ?? { total_ht: 0, total_ttc: 0, ventes: 0 };
        cur.total_ht += ht; cur.total_ttc += ttc; cur.ventes += 1; byMonth.set(m, cur);
      }
      if (vend) {
        const cv = byVend.get(vend) ?? { vendeur: vend, ventes: 0, total_ht: 0 };
        cv.ventes += 1; cv.total_ht += ht; byVend.set(vend, cv);
      }
      totalHT += ht; totalTTC += ttc; ventes += 1;
    }
  }

  dates.sort((a, b) => a.localeCompare(b));
  firstDate = dates[0] ?? null; lastDate = dates[dates.length - 1] ?? null;

  const months = Array.from(byMonth.entries()).map(([mois, v]) => ({ mois, ...v }))
    .sort((a, b) => a.mois.localeCompare(b.mois));
  const vendors = Array.from(byVend.values()).sort((a, b) => b.ventes - a.ventes);
  const mainVendor = vendors[0]?.vendeur ?? null;

  const recent = [...data].sort((a, b) => {
    const ad = toDateSafe(a.date_facture)?.getTime() ?? 0;
    const bd = toDateSafe(b.date_facture)?.getTime() ?? 0;
    return bd - ad;
  }).slice(0, 50);

  const displayId = clientName || idRaw;

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Client — {displayId}</h1>
        <p className="subtitle">Agrégats mensuels, vendeur associé et dernières factures (source: vente_vendeur).</p>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-label">Ventes</div><div className="kpi-value">{ventes}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total HT</div><div className="kpi-value">{totalHT.toLocaleString('fr-FR')}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total TTC</div><div className="kpi-value">{totalTTC.toLocaleString('fr-FR')}</div></div>
          {firstDate && <div className="kpi-card"><div className="kpi-label">Premier achat</div><div className="kpi-value">{firstDate}</div></div>}
          {lastDate && <div className="kpi-card"><div className="kpi-label">Dernier achat</div><div className="kpi-value">{lastDate}</div></div>}
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
            <div className="subtitle">Vendeur associé</div>
            {mainVendor ? (
              <div>
                <Link className="cell-link" href={`/vendeur/${encodeURIComponent(mainVendor)}`}>{mainVendor}</Link>
                <div style={{ marginTop: 8 }}>
                  <table className="table">
                    <thead><tr><th>Vendeur</th><th>Ventes</th><th style={{ textAlign:'right' }}>Total HT</th></tr></thead>
                    <tbody>
                      {vendors.map((v, i) => (
                        <tr key={i}><td>{v.vendeur}</td><td>{v.ventes}</td><td style={{ textAlign:'right' }}>{v.total_ht.toLocaleString('fr-FR')}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="alert">Aucun vendeur trouvé.</div>
            )}
          </div>
        </div>

        <div className="section" style={{ marginTop: 16 }}>
          <div className="subtitle">Dernières factures</div>
          <table className="table">
            <thead><tr><th>Date</th><th>Facture</th><th style={{ textAlign:'right' }}>Total HT</th><th style={{ textAlign:'right' }}>Total TTC</th></tr></thead>
            <tbody>
              {recent.map((r, i) => {
                const dObj = toDateSafe(r.date_facture);
                const d = dObj ? dObj.toISOString().slice(0, 10) : '';
                const ht = parseAmount(r.total_ht).toLocaleString('fr-FR');
                const ttc = parseAmount(r.total_ttc).toLocaleString('fr-FR');
                return (<tr key={i}><td>{d}</td><td>{String(r.num_facture ?? '')}</td><td style={{ textAlign:'right' }}>{ht}</td><td style={{ textAlign:'right' }}>{ttc}</td></tr>);
              })}
              {!recent.length && (<tr><td colSpan={4}><div className="alert">Aucune facture.</div></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
