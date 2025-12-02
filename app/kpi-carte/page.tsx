'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

type CityPoint = {
  ville: string;
  clients: number;
  total_ht: number;
  postcode?: string | null;
  lat?: number;
  lon?: number;
};

function monthRange(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  const s = start.toISOString().slice(0, 10);
  const e = end.toISOString().slice(0, 10);
  const label = `${y}-${String(m + 1).padStart(2, '0')}`;
  return { s, e, label };
}

export default function Page() {
  const [points, setPoints] = useState<CityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const { s, e, label } = useMemo(() => monthRange(), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStatus('Chargement des ventes…');
      const { data, error } = await supabase
        .from('vente_vendeur')
        .select('code_client,client,ville,code_postal,total_ht,date_facture')
        .gte('date_facture', s)
        .lt('date_facture', e);
      if (error) {
        setStatus(error.message);
        setLoading(false);
        return;
      }
      const byCity = new Map<string, { clients: Set<string>; total_ht: number; postcodes: Set<string> }>();
      for (const r of (data || []) as any[]) {
        const city = String(r.ville || '').trim();
        if (!city) continue;
        const key = city.toUpperCase();
        const cur = byCity.get(key) ?? { clients: new Set<string>(), total_ht: 0, postcodes: new Set<string>() };
        cur.clients.add(String(r.code_client || r.client || ''));
        const raw = r.total_ht;
        const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(',', '.'));
        if (isFinite(n)) cur.total_ht += n;
        const cp = String(r.code_postal ?? '').trim();
        if (cp) cur.postcodes.add(cp);
        byCity.set(key, cur);
      }
      const pts: CityPoint[] = Array.from(byCity.entries()).map(([ville, v]) => ({
        ville,
        clients: v.clients.size,
        total_ht: v.total_ht,
        postcode: v.postcodes.values().next().value ?? null,
      }));
      if (!pts.length) {
        setPoints([]);
        setStatus(`Aucune donnée pour le mois ${label}`);
        setLoading(false);
        return;
      }
      setStatus('Géocodage des villes…');
      // géocodage via API Adresse data.gouv.fr (compatible CORS)
      const out: CityPoint[] = [];
      for (const p of pts) {
        try {
          const q = encodeURIComponent(p.ville);
          const url = p.postcode
            ? `https://api-adresse.data.gouv.fr/search/?q=${q}&postcode=${encodeURIComponent(p.postcode)}&limit=1`
            : `https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`;
          const resp = await fetch(url);
          const js = await resp.json();
          if (js && Array.isArray(js.features) && js.features.length) {
            const coords = js.features[0].geometry?.coordinates;
            const lon = parseFloat(coords?.[0]);
            const lat = parseFloat(coords?.[1]);
            if (isFinite(lat) && isFinite(lon)) out.push({ ...p, lat, lon }); else out.push(p);
          } else out.push(p);
        } catch {
          out.push(p);
        }
      }
      if (!cancelled) {
        setPoints(out);
        setLoading(false);
        setStatus('');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [s, e]);

  const W = 820, H = 720;
  const minLat = 41.0, maxLat = 51.5;
  const minLon = -5.5, maxLon = 9.5;
  const toXY = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * W;
    const y = ((maxLat - lat) / (maxLat - minLat)) * H;
    return { x, y };
  };

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Carte clients du mois {label}</h1>
        <p className="subtitle">Source: `vente_vendeur` — points par ville, survol pour détails.</p>

        {loading && <div className="progress"><div className="progress-bar" /></div>}
        {status && <div className="status"><div className="alert">{status}</div></div>}

        <div style={{ position: 'relative', width: W, height: H, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 12, background: 'linear-gradient(180deg,#fff6ea,#f8ead2)' }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Blank_map_of_France.svg/800px-Blank_map_of_France.svg.png" alt="Carte" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .35, pointerEvents: 'none' }} />
          {points.filter(p => typeof p.lat === 'number' && typeof p.lon === 'number').map((p, i) => {
            const { x, y } = toXY(p.lat!, p.lon!);
            return (
              <div key={i} title={`${p.ville}\nClients: ${p.clients}\nTotal HT: ${p.total_ht.toLocaleString('fr-FR')}`}
                   style={{ position: 'absolute', left: x - 6, top: y - 6, width: 12, height: 12, background: 'var(--primary)', borderRadius: 999, boxShadow: '0 0 0 2px rgba(0,0,0,.25)' }} />
            );
          })}
        </div>

        <div className="section" style={{ marginTop: 12 }}>
          <div className="subtitle">Villes géocodées</div>
          <table className="table">
            <thead><tr><th>Ville</th><th>Clients</th><th style={{ textAlign:'right' }}>Total HT</th></tr></thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i}><td>{p.ville}</td><td>{p.clients}</td><td style={{ textAlign:'right' }}>{p.total_ht.toLocaleString('fr-FR')}</td></tr>
              ))}
              {!points.length && (<tr><td colSpan={3}><div className="alert">Aucune donnée.</div></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
