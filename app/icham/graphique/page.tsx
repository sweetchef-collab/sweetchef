"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type MonthRow = { mois: string; total_ht: number; icham: number; terrain: number; televente: number; autre: number };

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

function recentMonths(count = 12) {
  const now = new Date();
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    list.push(label);
  }
  return list.reverse();
}

function poleOf(vend: any) {
  const u = String(vend ?? '').trim().toUpperCase();
  const poleTerrain = ["FADOUA","ZOUHAIR","MOHA","MAISSA","HAMZA","TAHA","JASSIM","ANAS","ILYASSE"];
  const poleTelevente = ["SOPHIA","SIHAM","CHAYMAE","NOURA","INES","RIZLANE","KENZA"];
  if (!u) return 'Autre';
  if (u === 'ICHAM') return 'Icham';
  if (poleTerrain.includes(u)) return 'Terrain';
  if (poleTelevente.includes(u)) return 'Télévente';
  return 'Autre';
}

export default function Page() {
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [RC, setRC] = useState<any | null>(null);
  const [selectedPole, setSelectedPole] = useState<null | 'Icham' | 'Terrain' | 'Télévente' | 'Autre'>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRC() {
      try { const mod = await import('recharts'); if (!cancelled) setRC(mod); } catch {}
    }
    async function loadData() {
      setLoading(true);
      setStatus('Chargement…');
      const months = recentMonths(12);
      const map = new Map<string, MonthRow>();
      months.forEach((m) => map.set(m, { mois: m, total_ht: 0, icham: 0, terrain: 0, televente: 0, autre: 0 }));
      for (let offset = 0; offset < 1000000; offset += 1000) {
        const { data: chunk, error } = await supabase
          .from('vente_vendeur')
          .select('date_facture,total_ht,vendeur')
          .order('id', { ascending: true })
          .range(offset, offset + 999);
        if (error) { setStatus(error.message); break; }
        if (!Array.isArray(chunk) || chunk.length === 0) break;
        for (const r of chunk as any[]) {
          const m = monthFrom(r.date_facture);
          if (!m || !map.has(m)) continue;
          const ht = parseAmount(r.total_ht);
          const cur = map.get(m)!; cur.total_ht += ht;
          const pole = poleOf(r.vendeur);
          if (pole === 'Icham') cur.icham += ht;
          else if (pole === 'Terrain') cur.terrain += ht;
          else if (pole === 'Télévente') cur.televente += ht;
          else cur.autre += ht;
        }
        if (chunk.length < 1000) break;
      }
      if (!cancelled) {
        const out = Array.from(map.values());
        setRows(out);
        setStatus('');
        setLoading(false);
      }
    }
    loadRC();
    loadData();
    return () => { cancelled = true; };
  }, []);

  const barData = rows.map(r => ({ mois: r.mois, Icham: Math.round(r.icham), Terrain: Math.round(r.terrain), Télévente: Math.round(r.televente), Autre: Math.round(r.autre) }));
  const valForPole = (r: MonthRow, name: 'Icham'|'Terrain'|'Télévente'|'Autre') => name === 'Icham' ? r.icham : name === 'Terrain' ? r.terrain : name === 'Télévente' ? r.televente : r.autre;
  const lineDataFiltered = selectedPole
    ? rows.map(r => ({ mois: r.mois, value: Math.round(valForPole(r, selectedPole)) }))
    : rows.map(r => ({ mois: r.mois, value: Math.round(r.total_ht) }));
  const sum = useMemo(() => rows.reduce((a,b)=> a + (b.total_ht||0), 0), [rows]);
  const sumIcham = useMemo(() => rows.reduce((a,b)=> a + (b.icham||0), 0), [rows]);
  const sumTerrain = useMemo(() => rows.reduce((a,b)=> a + (b.terrain||0), 0), [rows]);
  const sumTelevente = useMemo(() => rows.reduce((a,b)=> a + (b.televente||0), 0), [rows]);
  const sumAutre = useMemo(() => rows.reduce((a,b)=> a + (b.autre||0), 0), [rows]);
  const fmt = (v: any) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

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
        <h1 className="title">Graphiques — Manager Icham</h1>
        <p className="subtitle">Total HT et répartition par pôle (12 mois, source: vente_vendeur)</p>
        <div className="kpi-cards" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 8 }}>
          <div className="kpi-card"><div className="kpi-label">Total HT</div><div className="kpi-value">{fmt(sum)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Icham</div><div className="kpi-value">{fmt(sumIcham)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Terrain</div><div className="kpi-value">{fmt(sumTerrain)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Télévente</div><div className="kpi-value">{fmt(sumTelevente)}</div></div>
          <div className="kpi-card"><div className="kpi-label">Autre</div><div className="kpi-value">{fmt(sumAutre)}</div></div>
        </div>
        {loading && <div className="progress"><div className="progress-bar" /></div>}
        {status && <div className="status"><div className="alert">{status}</div></div>}

        <div className="section">
          <div className="subtitle">Total HT — 12 derniers mois</div>
          <div style={{ width: '100%', height: 340 }}>
            {RC ? (
              <RC.ResponsiveContainer width="100%" height="100%">
                <RC.LineChart data={lineDataFiltered} margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
                  <RC.CartesianGrid strokeDasharray="3 3" />
                  <RC.XAxis dataKey="mois" />
                  <RC.YAxis width={80} tickFormatter={(v:any)=>new Intl.NumberFormat('fr-FR').format(v)} />
                  <RC.Tooltip content={({active,payload,label}:any)=> active && payload?.length ? (
                    <div className="tooltip">
                      <div className="title">{label}</div>
                      <div className="row"><span>{selectedPole ? selectedPole : 'Total HT'}</span><span>{fmt(payload[0].value)}</span></div>
                    </div>
                  ) : null} />
                  <RC.Legend />
                  <RC.Line type="monotone" dataKey="value" stroke="#e67e22" strokeWidth={2} dot={{ r: 2 }} />
                </RC.LineChart>
              </RC.ResponsiveContainer>
            ) : <div className="alert">Chargement du module graphiques…</div>}
          </div>
        </div>

        <div className="section">
          <div className="subtitle">HT par pôle — 12 derniers mois</div>
          <div style={{ width: '100%', height: 360 }}>
            {RC ? (
              <RC.ResponsiveContainer width="100%" height="100%">
                <RC.BarChart data={barData} margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
                  <RC.CartesianGrid strokeDasharray="3 3" />
                  <RC.XAxis dataKey="mois" />
                  <RC.YAxis width={80} tickFormatter={(v:any)=>new Intl.NumberFormat('fr-FR').format(v)} />
                  <RC.Tooltip content={({active,payload,label}:any)=> active && payload?.length ? (
                    <div className="tooltip">
                      <div className="title">{label}</div>
                      {payload.map((p:any,i:number)=> (
                        <div className="row" key={i}><span>{p.name}</span><span>{fmt(p.value)}</span></div>
                      ))}
                    </div>
                  ) : null} />
                  <RC.Legend />
                  {selectedPole == null && (
                    <>
                      <RC.Bar dataKey="Icham" stackId="a" fill="#e67e22" onClick={(d:any)=> { setSelectedPole('Icham'); }} />
                      <RC.Bar dataKey="Terrain" stackId="a" fill="#2980b9" onClick={(d:any)=> { setSelectedPole('Terrain'); }} />
                      <RC.Bar dataKey="Télévente" stackId="a" fill="#27ae60" onClick={(d:any)=> { setSelectedPole('Télévente'); }} />
                      <RC.Bar dataKey="Autre" stackId="a" fill="#8e44ad" onClick={(d:any)=> { setSelectedPole('Autre'); }} />
                    </>
                  )}
                  {selectedPole === 'Icham' && (<RC.Bar dataKey="Icham" stackId="a" fill="#e67e22" />)}
                  {selectedPole === 'Terrain' && (<RC.Bar dataKey="Terrain" stackId="a" fill="#2980b9" />)}
                  {selectedPole === 'Télévente' && (<RC.Bar dataKey="Télévente" stackId="a" fill="#27ae60" />)}
                  {selectedPole === 'Autre' && (<RC.Bar dataKey="Autre" stackId="a" fill="#8e44ad" />)}
                </RC.BarChart>
              </RC.ResponsiveContainer>
            ) : <div className="alert">Chargement du module graphiques…</div>}
          </div>
        </div>

        <div className="section" style={{ marginTop: 8 }}>
          <div className="subtitle">Filtre pôle</div>
          <div className="segmented" aria-label="Filtre pôle" style={{ marginTop: 8 }}>
            <button className={`seg-btn ${selectedPole==='Icham'?'active':''}`} onClick={()=> setSelectedPole('Icham')}>Icham</button>
            <button className={`seg-btn ${selectedPole==='Terrain'?'active':''}`} onClick={()=> setSelectedPole('Terrain')}>Terrain</button>
            <button className={`seg-btn ${selectedPole==='Télévente'?'active':''}`} onClick={()=> setSelectedPole('Télévente')}>Télévente</button>
            <button className={`seg-btn ${selectedPole==='Autre'?'active':''}`} onClick={()=> setSelectedPole('Autre')}>Autre</button>
            <button className={`seg-btn ${selectedPole===null?'active':''}`} onClick={()=> setSelectedPole(null)}>Tous</button>
          </div>
        </div>
      </div>
    </div>
  );
}
