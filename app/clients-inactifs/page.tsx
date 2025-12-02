"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

function rangeFromMonth(mois: string) {
  const [y, m] = mois.split('-').map((v) => parseInt(v, 10));
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const s = start.toISOString().slice(0, 10);
  const e = end.toISOString().slice(0, 10);
  return { s, e };
}

function recentMonths(count = 18) {
  const now = new Date();
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    list.push(label);
  }
  return list;
}

export default function Page() {
  const [mois, setMois] = useState(recentMonths(1)[0]);
  const [rows, setRows] = useState<any[]>([]);
  const [actifs, setActifs] = useState<any[]>([]);
  const [inactifs, setInactifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const months = useMemo(() => recentMonths(18), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { s, e } = rangeFromMonth(mois);
      const { data: clients } = await supabase
        .from('client_vendeur')
        .select('code_client,societe,groupe,code_postal,ville,vendeur')
        .order('societe', { ascending: true })
        .range(0, 99999);
      const { data: ventes } = await supabase
        .from('vente_vendeur')
        .select('code_client')
        .gte('date_facture', s)
        .lt('date_facture', e)
        .range(0, 99999);
      if (!cancelled) {
        const codes = new Set<string>();
        for (const v of (ventes || []) as any[]) {
          const code = String(v.code_client ?? '').trim().toUpperCase();
          if (code) codes.add(code);
        }
        const list = Array.isArray(clients) ? (clients as any[]) : [];
        const a: any[] = []; const i: any[] = [];
        for (const c of list) {
          const code = String(c.code_client ?? '').trim().toUpperCase();
          if (code && codes.has(code)) a.push(c); else i.push(c);
        }
        setRows(list); setActifs(a); setInactifs(i); setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, [mois]);

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 className="title">Clients inactifs</h1>
          <div style={{ display:'flex', gap:8 }}>
            <select value={mois} onChange={(e) => setMois(e.target.value)}>
              {months.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>
        </div>
        <p className="subtitle">Comparer `client_vendeur` avec les commandes de {mois}.</p>

        <div className="kpi-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="kpi-card"><div className="kpi-label">Total clients</div><div className="kpi-value">{rows.length}</div></div>
          <div className="kpi-card"><div className="kpi-label">Ont commandé</div><div className="kpi-value">{actifs.length}</div></div>
          <div className="kpi-card"><div className="kpi-label">N'ont pas commandé</div><div className="kpi-value">{inactifs.length}</div></div>
        </div>

        <div className="section" style={{ padding: 12, borderRadius: 16, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', marginTop: 16 }}>
          <div className="subtitle" style={{ marginBottom: 8 }}>N'ont pas commandé ({inactifs.length})</div>
          <div style={{ maxHeight: '55vh', overflow:'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
            <table className="table" style={{ marginTop: 0, minWidth: 980 }}>
              <thead>
                <tr>
                  <th>Code client</th>
                  <th>Société</th>
                  <th>Groupe</th>
                  <th>Code postal</th>
                  <th>Ville</th>
                  <th>Vendeur</th>
                </tr>
              </thead>
              <tbody>
                {inactifs.map((r, i) => (
                  <tr key={i}>
                    <td>{String(r.code_client ?? '')}</td>
                    <td>{String(r.societe ?? '')}</td>
                    <td>{String(r.groupe ?? '')}</td>
                    <td>{String(r.code_postal ?? '')}</td>
                    <td>{String(r.ville ?? '')}</td>
                    <td><Link className="cell-link" href={`/vendeur/${encodeURIComponent(String(r.vendeur ?? ''))}`}>{String(r.vendeur ?? '')}</Link></td>
                  </tr>
                ))}
                {!inactifs.length && (
                  <tr><td colSpan={6}><div className="alert">Aucun client inactif.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section" style={{ padding: 12, borderRadius: 16, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', marginTop: 16 }}>
          <div className="subtitle" style={{ marginBottom: 8 }}>Ont commandé ({actifs.length})</div>
          <div style={{ maxHeight: '55vh', overflow:'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
            <table className="table" style={{ marginTop: 0, minWidth: 980 }}>
              <thead>
                <tr>
                  <th>Code client</th>
                  <th>Société</th>
                  <th>Groupe</th>
                  <th>Code postal</th>
                  <th>Ville</th>
                  <th>Vendeur</th>
                </tr>
              </thead>
              <tbody>
                {actifs.map((r, i) => (
                  <tr key={i}>
                    <td>{String(r.code_client ?? '')}</td>
                    <td>{String(r.societe ?? '')}</td>
                    <td>{String(r.groupe ?? '')}</td>
                    <td>{String(r.code_postal ?? '')}</td>
                    <td>{String(r.ville ?? '')}</td>
                    <td><Link className="cell-link" href={`/vendeur/${encodeURIComponent(String(r.vendeur ?? ''))}`}>{String(r.vendeur ?? '')}</Link></td>
                  </tr>
                ))}
                {!actifs.length && (
                  <tr><td colSpan={6}><div className="alert">Aucun client actif.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
