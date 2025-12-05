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

export default async function Page() {
  let rows: any[] = [];
  for (let offset = 0; offset < 1000000; offset += 1000) {
    const { data: chunk } = await supabase
      .from('vente_vendeur')
      .select('vendeur,code_client,total_ht,total_ttc')
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    rows = rows.concat(chunk as any[]);
    if (chunk.length < 1000) break;
  }

  const byVend = new Map<string, { vendeur: string; total_ht: number; total_ttc: number; ventes: number; clients: Set<string> }>();
  for (const r of rows as any[]) {
    const vend = String(r.vendeur ?? '').trim();
    if (!vend) continue;
    const ht = parseAmount(r.total_ht);
    const ttc = parseAmount(r.total_ttc);
    const cur = byVend.get(vend) ?? { vendeur: vend, total_ht: 0, total_ttc: 0, ventes: 0, clients: new Set<string>() };
    cur.total_ht += ht; cur.total_ttc += ttc; cur.ventes += 1;
    const code = String(r.code_client ?? '').trim().toUpperCase(); if (code) cur.clients.add(code);
    byVend.set(vend, cur);
  }

  const list = Array.from(byVend.values()).map((v) => ({
    vendeur: v.vendeur,
    ventes: v.ventes,
    clients: v.clients.size,
    total_ht: v.total_ht,
    total_ttc: v.total_ttc,
  })).sort((a, b) => b.total_ht - a.total_ht);

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Vendeurs</h1>
        <p className="subtitle">Liste des vendeurs avec totaux HT/TTC, nombre de ventes et clients.</p>
        <div className="section">
          <table className="table">
            <thead>
              <tr>
                <th>Vendeur</th>
                <th>Clients</th>
                <th>Ventes</th>
                <th style={{ textAlign:'right' }}>Total HT</th>
                <th style={{ textAlign:'right' }}>Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.vendeur}>
                  <td><Link className="cell-link" href={`/vendeur/${encodeURIComponent(v.vendeur)}`}>{v.vendeur}</Link></td>
                  <td>{v.clients}</td>
                  <td>{v.ventes}</td>
                  <td style={{ textAlign:'right' }}>{v.total_ht.toLocaleString('fr-FR')}</td>
                  <td style={{ textAlign:'right' }}>{v.total_ttc.toLocaleString('fr-FR')}</td>
                </tr>
              ))}
              {!list.length && (
                <tr><td colSpan={5}><div className="alert">Aucune donnée.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

