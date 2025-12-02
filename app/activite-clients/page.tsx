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
      const { data: clients } = await supabase
        .from('client_vendeur')
        .select('code_client,societe,groupe,code_postal,ville,vendeur')
        .order('societe', { ascending: true })
        .range(0, 99999);
      const { data: ventes } = await supabase
        .from('vente_vendeur')
        .select('code_client,client,date_facture,total_ht,vendeur')
        .gte('date_facture', sWin)
        .lt('date_facture', eWin)
        .range(0, 99999);

      if (!cancelled) {
        const base = Array.isArray(clients) ? (clients as any[]) : [];
        const agg = new Map<string, {
          code_client: string; client?: string; societe?: string; groupe?: string; code_postal?: string; ville?: string; vendeur?: string;
          total_ht: number; commandes: number; premier_mois?: string | null; mois_actifs: Set<string>; flags: Record<string, boolean>;
        }>();
        for (const c of base) {
          const code = String(c.code_client ?? '').trim().toUpperCase();
          if (!code) continue;
          agg.set(code, {
            code_client: code,
            client: String(c.societe ?? ''),
            societe: String(c.societe ?? ''),
            groupe: String(c.groupe ?? ''),
            code_postal: String(c.code_postal ?? ''),
            ville: String(c.ville ?? ''),
            vendeur: String(c.vendeur ?? ''),
            total_ht: 0, commandes: 0, premier_mois: null, mois_actifs: new Set<string>(), flags: {},
          });
        }
        for (const v of (ventes || []) as any[]) {
          const code = String(v.code_client ?? '').trim().toUpperCase();
          if (!code) continue;
          const d = typeof v.date_facture === 'string' ? v.date_facture.slice(0, 7) : new Date(v.date_facture).toISOString().slice(0, 7);
          const htRaw = v.total_ht;
          const ht = typeof htRaw === 'number' ? htRaw : parseFloat(String(htRaw ?? '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
          const htVal = isFinite(ht) ? ht : 0;
          const cur = agg.get(code) ?? {
            code_client: code,
            client: String(v.client ?? ''),
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
      const mV = !vend || String(r.vendeur ?? '') === vend;
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
  function sanitize(v: any) {
    const s = String(v ?? '');
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function handleExport() {
    const header = [
      'code_client','client','groupe','code_postal','ville','vendeur',
      'total_ht','nb_commandes','moyenne_par_commande','premier_mois','moyenne_par_mois',
      `commande_${mois}`, `commande_${m1}`, `commande_${m2}`
    ];
    const rowsCsv = [header.join(';')];
    for (const r of filtered) {
      rowsCsv.push([
        sanitize(r.code_client),
        sanitize(r.client),
        sanitize(r.groupe),
        sanitize(r.code_postal),
        sanitize(r.ville),
        sanitize(r.vendeur),
        fmtNumFR(r.total_ht || 0),
        sanitize(r.commandes),
        fmtNumFR(r.moyenne_commande || 0),
        sanitize(r.premier_mois || ''),
        fmtNumFR(r.moyenne_par_mois || 0),
        sanitize(r.flag_mois),
        sanitize(r.flag_m1),
        sanitize(r.flag_m2),
      ].join(';'));
    }
    const blob = new Blob([rowsCsv.join('\n')], { type: 'text/csv;charset=utf-8;' });
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
