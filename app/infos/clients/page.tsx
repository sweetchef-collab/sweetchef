"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [vend, setVend] = useState('');
  const [grp, setGrp] = useState('');
  const [city, setCity] = useState('');
  const [cp, setCp] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStatus('Chargement…');
      const { data, error } = await supabase
        .from('client_vendeur')
        .select('code_client,societe,groupe,code_postal,ville,vendeur')
        .order('societe', { ascending: true })
        .range(0, 99999);
      if (!cancelled) {
        if (error) setStatus(error.message); else setStatus('');
        setRows(Array.isArray(data) ? (data as any[]) : []);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      const mQ = !qq || [r.code_client, r.societe, r.ville].some((v: any) => String(v ?? '').toLowerCase().includes(qq));
      const mV = !vend || String(r.vendeur ?? '') === vend;
      const mG = !grp || String(r.groupe ?? '') === grp;
      const mC = !city || String(r.ville ?? '') === city;
      const mP = !cp || String(r.code_postal ?? '') === cp;
      return mQ && mV && mG && mC && mP;
    });
  }, [rows, q, vend, grp, city, cp]);

  const vendors = useMemo(() => Array.from(new Set(rows.map((r) => String(r.vendeur ?? '').trim()).filter(Boolean))).sort(), [rows]);
  const groups = useMemo(() => Array.from(new Set(rows.map((r) => String(r.groupe ?? '').trim()).filter(Boolean))).sort(), [rows]);
  const cities = useMemo(() => Array.from(new Set(rows.map((r) => String(r.ville ?? '').trim()).filter(Boolean))).sort(), [rows]);
  const postcodes = useMemo(() => Array.from(new Set(rows.map((r) => String(r.code_postal ?? '').trim()).filter(Boolean))).sort(), [rows]);

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Infos — Clients</h1>
        <p className="subtitle">Liste complète depuis `client_vendeur`.</p>
        {loading && <div className="progress" style={{ marginTop: 8 }}><div className="progress-bar" /></div>}
        {status && <div className="alert" style={{ marginTop: 8 }}>{status}</div>}

        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          <input placeholder="Recherche (code, société, ville)" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={vend} onChange={(e) => setVend(e.target.value)}>
            <option value="">Vendeur</option>
            {vendors.map((v) => (<option key={v} value={v}>{v}</option>))}
          </select>
          <select value={grp} onChange={(e) => setGrp(e.target.value)}>
            <option value="">Groupe</option>
            {groups.map((g) => (<option key={g} value={g}>{g}</option>))}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Ville</option>
            {cities.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select value={cp} onChange={(e) => setCp(e.target.value)}>
            <option value="">Code postal</option>
            {postcodes.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto', marginTop: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
          <table className="table" style={{ marginTop: 0 }}>
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
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td>{String(r.code_client ?? '')}</td>
                  <td>{String(r.societe ?? '')}</td>
                  <td>{String(r.groupe ?? '')}</td>
                  <td>{String(r.code_postal ?? '')}</td>
                  <td>{String(r.ville ?? '')}</td>
                  <td><Link className="cell-link" href={`/vendeur/${encodeURIComponent(String(r.vendeur ?? ''))}`}>{String(r.vendeur ?? '')}</Link></td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6}><div className="alert">Aucune donnée.</div></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
