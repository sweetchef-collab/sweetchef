"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

function rangeFromMonth(mois: string) {
  const [y, m] = mois.split('-').map((v) => parseInt(v, 10));
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const s = start.toISOString().slice(0, 10);
  const e = end.toISOString().slice(0, 10);
  return { s, e };
}

function prevMonth(mois: string, k = 1) {
  const [y, m] = mois.split('-').map((v) => parseInt(v, 10));
  const d = new Date(Date.UTC(y, m - 1 - k, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function Page() {
  const months = useMemo(() => recentMonths(18), []);
  const [mois, setMois] = useState(months[0]);
  const m1 = prevMonth(mois, 1);
  const m2 = prevMonth(mois, 2);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [vend, setVend] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const startWindow = prevMonth(mois, 17);
      const { s: sWin } = rangeFromMonth(startWindow);
      const { e: eWin } = rangeFromMonth(mois);
      let ventesAll: any[] = [];
      for (let offset = 0; offset < 1000000; offset += 1000) {
        const { data: chunk } = await supabase
          .from('vente_vendeur')
          .select('code_client,client,vendeur,ville,code_postal,date_facture,total_ht')
          .order('id', { ascending: true })
          .range(offset, offset + 999);
        if (!Array.isArray(chunk) || chunk.length === 0) break;
        ventesAll = ventesAll.concat(chunk as any[]);
        if (chunk.length < 1000) break;
      }

      if (ventesAll.length === 0) {
        const clientsAll: any[] = [];
        for (let offset = 0; offset < 1000000; offset += 1000) {
          const { data: chunkC } = await supabase
            .from('client_vendeur')
            .select('code_client,societe,groupe,code_postal,ville,vendeur')
            .order('societe', { ascending: true })
            .range(offset, offset + 999);
          if (!Array.isArray(chunkC) || chunkC.length === 0) break;
          clientsAll.push(...(chunkC as any[]));
          if (chunkC.length < 1000) break;
        }
        const vendMap = new Map<string, { client?: string; vendeur?: string; ville?: string; code_postal?: string }>();
        for (const c of clientsAll as any[]) {
          const code = String(c.code_client ?? '').trim().toUpperCase();
          if (!code) continue;
          vendMap.set(code, {
            client: String(c.societe ?? ''),
            vendeur: String(c.vendeur ?? ''),
            ville: String(c.ville ?? ''),
            code_postal: String(c.code_postal ?? ''),
          });
        }
        for (let offset = 0; offset < 1000000; offset += 1000) {
          const { data: chunkS } = await supabase
            .from('sales_clean')
            .select('code_client,client,date_facture,total_ht')
            .order('id', { ascending: true })
            .range(offset, offset + 999);
          if (!Array.isArray(chunkS) || chunkS.length === 0) break;
          const merged = (chunkS as any[]).map((r) => {
            const code = String(r.code_client ?? '').trim().toUpperCase();
            const m = vendMap.get(code) || {};
            return {
              code_client: code,
              client: String(m.client ?? r.client ?? ''),
              vendeur: String(m.vendeur ?? ''),
              ville: String(m.ville ?? ''),
              code_postal: String(m.code_postal ?? ''),
              date_facture: r.date_facture,
              total_ht: r.total_ht,
            };
          });
          ventesAll = ventesAll.concat(merged);
          if (chunkS.length < 1000) break;
        }
      }

      if (!cancelled) {
        const agg = new Map<string, {
          code_client: string; client?: string; societe?: string; groupe?: string; code_postal?: string; ville?: string; vendeur?: string;
          total_ht: number; commandes: number; premier_mois?: string | null; mois_actifs: Set<string>; flags: Record<string, boolean>;
        }>();
        for (const v of ventesAll as any[]) {
          const code = String(v.code_client ?? '').trim().toUpperCase();
          if (!code) continue;
          let d: string | null = null;
          const raw = v.date_facture;
          if (typeof raw === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) d = raw.slice(0, 7);
            else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
              const [dd, mm, yyyy] = raw.split('/').map((x: any) => parseInt(x, 10));
              d = new Date(Date.UTC(yyyy, mm - 1, dd)).toISOString().slice(0, 7);
            }
          } else if (raw) {
            d = new Date(raw).toISOString().slice(0, 7);
          }
          if (!d) continue;
          const dm = d; // format YYYY-MM
          const winStart = prevMonth(mois, 17);
          if (dm < winStart || dm > mois) continue;
          const htRaw = v.total_ht;
          const ht = typeof htRaw === 'number' ? htRaw : parseFloat(String(htRaw ?? '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
          const htVal = isFinite(ht) ? ht : 0;
          const cur = agg.get(code) ?? {
            code_client: code,
            client: String(v.client ?? ''),
            societe: String(v.client ?? ''),
            groupe: '',
            code_postal: String(v.code_postal ?? ''),
            ville: String(v.ville ?? ''),
            vendeur: String(v.vendeur ?? ''),
            total_ht: 0, commandes: 0, premier_mois: null, mois_actifs: new Set<string>(), flags: {},
          };
          cur.total_ht += htVal;
          cur.commandes += 1;
          if (!cur.premier_mois || (d && d < cur.premier_mois)) cur.premier_mois = d;
          if (d) cur.mois_actifs.add(d);
          if (d === mois || d === m1 || d === m2) cur.flags[d] = true;
          agg.set(code, cur);
        }
        const out = Array.from(agg.values()).map((r) => {
          const moisCount = r.mois_actifs.size || 1;
          const moyenne_commande = r.commandes ? (r.total_ht / r.commandes) : 0;
          const moyenne_par_mois = r.total_ht / moisCount;
          return {
            ...r,
            moyenne_commande,
            moyenne_par_mois,
            flag_mois: r.flags[mois] ? 'Positif' : 'Négatif',
            flag_m1: r.flags[m1] ? 'Positif' : 'Négatif',
            flag_m2: r.flags[m2] ? 'Positif' : 'Négatif',
          };
        });
        setRows(out);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [mois]);

  const vendors = useMemo(() => Array.from(new Set(rows.map((r) => String(r.vendeur ?? '').trim()).filter(Boolean))).sort(), [rows]);
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      const mQ = !qq || [r.code_client, r.client, r.ville].some((v: any) => String(v ?? '').toLowerCase().includes(qq));
      const mV = !vend || String(r.vendeur ?? '').trim().toUpperCase() === vend.trim().toUpperCase();
      return mQ && mV;
    });
  }, [rows, q, vend]);

  function fmtNumFR(n: any) {
    if (typeof n === 'number') return n.toString().replace(/\./g, ',');
    if (n == null) return '';
    const s = String(n).trim().replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
    const f = parseFloat(s);
    if (!isFinite(f)) return '';
    return f.toString().replace(/\./g, ',');
  }
  function toCsv(fields: string[], data: any[][]) {
    const esc = (v: any) => {
      const s = String(v ?? '');
      const needs = /[";\n]/.test(s);
      const t = s.replace(/"/g, '""');
      return needs ? `"${t}"` : t;
    };
    const lines = [fields.map(esc).join(';')].concat(data.map((r) => r.map(esc).join(';')));
    return lines.join('\n');
  }
  function handleExport() {
    const header = [
      'code_client','client','groupe','code_postal','ville','vendeur',
      'total_ht','nb_commandes','moyenne_par_commande','premier_mois','moyenne_par_mois',
      `commande_${mois}`, `commande_${m1}`, `commande_${m2}`
    ];
    const data = filtered.map((r) => ([
      String(r.code_client ?? ''),
      String(r.client ?? ''),
      String(r.groupe ?? ''),
      String(r.code_postal ?? ''),
      String(r.ville ?? ''),
      String(r.vendeur ?? ''),
      fmtNumFR(r.total_ht || 0),
      String(r.commandes ?? ''),
      fmtNumFR(r.moyenne_commande || 0),
      String(r.premier_mois ?? ''),
      fmtNumFR(r.moyenne_par_mois || 0),
      String(r.flag_mois ?? ''),
      String(r.flag_m1 ?? ''),
      String(r.flag_m2 ?? ''),
    ]));
    const csv = toCsv(header, data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activite_clients_${mois}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 className="title">Activité — Clients</h1>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <select value={mois} onChange={(e) => setMois(e.target.value)}>
              {months.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
            <input placeholder="Recherche (code, client, ville)" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={vend} onChange={(e) => setVend(e.target.value)}>
              <option value="">Vendeur</option>
              {vendors.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
            <button className="btn" onClick={handleExport}>Exporter CSV</button>
          </div>
        </div>
        <p className="subtitle">Agrégats sur 18 mois. Indicateurs par mois: Positif (a commandé) / Négatif (n'a pas commandé).</p>

        <div className="section" style={{ padding: 12, borderRadius: 16, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', marginTop: 12 }}>
          <div className="subtitle" style={{ marginBottom: 8 }}>Liste clients</div>
          <div style={{ maxHeight: '65vh', overflow:'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
            <table className="table" style={{ marginTop: 0, minWidth: 1200 }}>
              <thead>
                <tr>
                  <th>Code client</th>
                  <th>Client</th>
                  <th>Groupe</th>
                  <th>Code postal</th>
                  <th>Ville</th>
                  <th>Vendeur</th>
                  <th style={{ textAlign:'right' }}>Total HT</th>
                  <th style={{ textAlign:'right' }}>Nb commandes</th>
                  <th style={{ textAlign:'right' }}>Moyenne/commande</th>
                  <th>Premier mois</th>
                  <th style={{ textAlign:'right' }}>Moyenne/mois</th>
                  <th>Commande {mois}</th>
                  <th>Commande {m1}</th>
                  <th>Commande {m2}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td>{r.code_client}</td>
                    <td>{r.client}</td>
                    <td>{r.groupe}</td>
                    <td>{r.code_postal}</td>
                    <td>{r.ville}</td>
                    <td><Link className="cell-link" href={`/vendeur/${encodeURIComponent(String(r.vendeur ?? ''))}`}>{String(r.vendeur ?? '')}</Link></td>
                    <td style={{ textAlign:'right' }}>{Number(r.total_ht || 0).toLocaleString('fr-FR')}</td>
                    <td style={{ textAlign:'right' }}>{r.commandes}</td>
                    <td style={{ textAlign:'right' }}>{Number(r.moyenne_commande || 0).toLocaleString('fr-FR')}</td>
                    <td>{r.premier_mois || ''}</td>
                    <td style={{ textAlign:'right' }}>{Number(r.moyenne_par_mois || 0).toLocaleString('fr-FR')}</td>
                    <td>{r.flag_mois}</td>
                    <td>{r.flag_m1}</td>
                    <td>{r.flag_m2}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={14}><div className="alert">Aucune donnée.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
