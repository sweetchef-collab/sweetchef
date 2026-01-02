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

export default async function Page() {
  const ck = cookies();
  const isIcham = ck.get('sc_role')?.value === 'icham';
  const isAdmin = ck.get('sc_admin')?.value === '1' || ck.get('sc_role')?.value === 'admin';
  if (!isIcham && !isAdmin) {
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

  const byClient = new Map<string, { id: string; client: string; ventes: number; total_ht: number; last: string | null }>();
  let totalHT = 0; let ventes = 0;
  for (const r of data as any[]) {
    const id = String(r.code_client ?? r.client ?? '');
    const name = String(r.client ?? '').trim();
    const ht = parseAmount(r.total_ht);
    const d = toDateSafe(r.date_facture);
    const ds = d ? d.toISOString().slice(0, 10) : null;
    if (id) {
      const cur = byClient.get(id) ?? { id, client: name || id, ventes: 0, total_ht: 0, last: null };
      cur.ventes += 1; cur.total_ht += ht; cur.last = ds && (!cur.last || ds > cur.last) ? ds : cur.last;
      byClient.set(id, cur);
    }
    totalHT += ht; ventes += 1;
  }
  const rows = Array.from(byClient.values()).sort((a,b) => b.total_ht - a.total_ht);

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
        <h1 className="title">Infos — Icham</h1>
        <p className="subtitle">Clients associés à Icham, derniers achats et totaux HT (source: vente_vendeur).</p>
        <div className="kpi-cards">
          <div className="kpi-card"><div className="kpi-label">Clients</div><div className="kpi-value">{rows.length}</div></div>
          <div className="kpi-card"><div className="kpi-label">Ventes</div><div className="kpi-value">{ventes}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total HT</div><div className="kpi-value">{totalHT.toLocaleString('fr-FR')}</div></div>
        </div>
        <div className="section" style={{ marginTop: 12 }}>
          <div className="subtitle">Clients</div>
          <table className="table">
            <thead><tr><th>Client</th><th>Ventes</th><th style={{ textAlign:'right' }}>Total HT</th><th>Dernier achat</th></tr></thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={i}>
                  <td><Link className="cell-link" href={`/client/${encodeURIComponent(c.id)}`}>{c.client}</Link></td>
                  <td>{c.ventes}</td>
                  <td style={{ textAlign:'right' }}>{c.total_ht.toLocaleString('fr-FR')}</td>
                  <td>{c.last ?? '—'}</td>
                </tr>
              ))}
              {!rows.length && (<tr><td colSpan={4}><div className="alert">Aucune donnée.</div></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
