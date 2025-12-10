"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type VendMonth = { mois: string; vendeur: string; total_ht: number };

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

function monthFrom(dv: any) {
  const d = toDateSafe(dv);
  return d ? d.toISOString().slice(0, 7) : null;
}

const fmt = (v: any) => new Intl.NumberFormat('fr-FR').format(Math.round(v || 0));

export default function Page() {
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVend, setSelectedVend] = useState<string | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [month, setMonth] = useState<string | null>(null);
  const [rows, setRows] = useState<VendMonth[]>([]);
  const [RC, setRC] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadRC() {
      try { const mod = await import('recharts'); if (!cancelled) setRC(mod); } catch {}
    }
    async function loadData() {
      setLoading(true); setStatus('Chargement…');
      const byVendMonth = new Map<string, number>();
      const vendTotals = new Map<string, number>();
      const monthSet = new Set<string>();
      for (let offset = 0; offset < 1000000; offset += 1000) {
        const { data: chunk, error } = await supabase
          .from('vente_vendeur')
          .select('date_facture,total_ht,vendeur')
          .order('id', { ascending: true })
          .range(offset, offset + 999);
        if (error) { setStatus(error.message); break; }
        if (!Array.isArray(chunk) || chunk.length === 0) break;
        for (const r of chunk as any[]) {
          const m = monthFrom(r.date_facture); const v = String(r.vendeur ?? '').trim();
          if (!m || !v) continue; monthSet.add(m);
          const ht = parseAmount(r.total_ht);
          const key = `${m}::${v}`;
          byVendMonth.set(key, (byVendMonth.get(key) ?? 0) + ht);
          vendTotals.set(v, (vendTotals.get(v) ?? 0) + ht);
        }
        if (chunk.length < 1000) break;
      }
      if (!cancelled) {
        const monthsOrdered = Array.from(monthSet.values()).sort();
        const allRows: VendMonth[] = [];
        for (const [key, total] of byVendMonth.entries()) {
          const [m, v] = key.split('::'); allRows.push({ mois: m, vendeur: v, total_ht: total });
        }
        const vendListWithTotals = Array.from(vendTotals.entries()).sort((a,b)=>b[1]-a[1]);
        const vendList = vendListWithTotals.map(([v])=>v);
        setRows(allRows);
        setMonths(monthsOrdered);
        setVendors(vendList);
        setMonth(monthsOrdered.length ? monthsOrdered[monthsOrdered.length-1] : null);
        setSelectedVend(vendList.length ? vendList[0] : null);
        setStatus(''); setLoading(false);
      }
    }
    loadRC(); loadData();
    return () => { cancelled = true; };
  }, []);

  const lineData = useMemo(() => {
    if (!selectedVend) return [] as any[];
    const map = new Map<string, number>();
    for (const r of rows) if (r.vendeur === selectedVend) map.set(r.mois, (map.get(r.mois) ?? 0) + r.total_ht);
    const out = Array.from(map.entries()).map(([mois,val])=>({ mois, value: Math.round(val) })).sort((a,b)=> a.mois.localeCompare(b.mois));
    return out;
  }, [rows, selectedVend]);

  const topForMonth = useMemo(() => {
    if (!month) return [] as any[];
    const map = new Map<string, number>();
    for (const r of rows) if (r.mois === month) map.set(r.vendeur, (map.get(r.vendeur) ?? 0) + r.total_ht);
    return Array.from(map.entries()).map(([vendeur,val])=>({ vendeur, value: Math.round(val) }))
      .sort((a,b)=> b.value - a.value).slice(0, 10);
  }, [rows, month]);

  const pieData = useMemo(() => topForMonth.map(x=> ({ name: x.vendeur, value: x.value })), [topForMonth]);

  const palette = ["#e67e22","#2980b9","#27ae60","#8e44ad","#c0392b","#16a085","#7f8c8d","#d35400","#2c3e50","#f39c12","#1abc9c","#9b59b6","#34495e"];

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Graphique — Vendeur</h1>
        <p className="subtitle">Tendances mensuelles et répartition des HT par vendeur.</p>
        <div className="segmented" aria-label="Choix vendeur">
          <select className="seg-btn" value={selectedVend ?? ''} onChange={(e)=> setSelectedVend(e.target.value || null)}>
            {vendors.map(v => (<option key={v} value={v}>{v}</option>))}
          </select>
          <select className="seg-btn" value={month ?? ''} onChange={(e)=> setMonth(e.target.value || null)}>
            {months.map(m => (<option key={m} value={m}>{m}</option>))}
          </select>
        </div>
        {loading && <div className="progress"><div className="progress-bar" /></div>}
        {status && <div className="status"><div className="alert">{status}</div></div>}

        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
          <div className="section">
            <div className="subtitle">HT mensuel — {selectedVend || '—'}</div>
            <div style={{ width: '100%', height: 320 }}>
              {RC ? (
                <RC.ResponsiveContainer width="100%" height="100%">
                  <RC.LineChart data={lineData} margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
                    <RC.CartesianGrid strokeDasharray="3 3" />
                    <RC.XAxis dataKey="mois" />
                    <RC.YAxis width={80} tickFormatter={(v:any)=> fmt(v)} />
                    <RC.Tooltip content={({active,payload,label}:any)=> active && payload?.length ? (
                      <div className="tooltip">
                        <div className="title">{label}</div>
                        <div className="row"><span>{selectedVend}</span><span>{fmt(payload[0].value)}</span></div>
                      </div>
                    ) : null} />
                    <RC.Legend />
                    <RC.Line type="monotone" dataKey="value" stroke="#2980b9" strokeWidth={2} dot={{ r: 2 }} />
                  </RC.LineChart>
                </RC.ResponsiveContainer>
              ) : <div className="alert">Chargement du module graphiques…</div>}
            </div>
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <div className="subtitle">Top vendeurs — {month || '—'}</div>
            <div style={{ width: '100%', height: 360 }}>
              {RC ? (
                <RC.ResponsiveContainer width="100%" height="100%">
                  <RC.BarChart data={topForMonth} layout="vertical" margin={{ top: 10, right: 20, left: 120, bottom: 0 }}>
                    <RC.CartesianGrid strokeDasharray="3 3" />
                    <RC.XAxis type="number" tickFormatter={(v:any)=> fmt(v)} />
                    <RC.YAxis type="category" dataKey="vendeur" width={110} />
                    <RC.Tooltip content={({active,payload}:any)=> active && payload?.length ? (
                      <div className="tooltip">
                        <div className="title">{payload[0].payload.vendeur}</div>
                        <div className="row"><span>HT</span><span>{fmt(payload[0].value)}</span></div>
                      </div>
                    ) : null} />
                    <RC.Legend />
                    <RC.Bar dataKey="value" onClick={(d:any)=> setSelectedVend(d?.payload?.vendeur ?? selectedVend)}>
                      {topForMonth.map((_, i) => (<RC.Cell key={`b-${i}`} fill={palette[i % palette.length]} />))}
                    </RC.Bar>
                  </RC.BarChart>
                </RC.ResponsiveContainer>
              ) : <div className="alert">Chargement du module graphiques…</div>}
            </div>
          </div>

          <div className="section">
            <div className="subtitle">Répartition HT — {month || '—'}</div>
            <div style={{ width: '100%', height: 320 }}>
              {RC ? (
                <RC.ResponsiveContainer width="100%" height="100%">
                  <RC.PieChart>
                    <RC.Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={(e:any)=> fmt(e.value)} onClick={(e:any)=> setSelectedVend(e?.name ?? selectedVend)}>
                      {pieData.map((_, i) => (
                        <RC.Cell key={`c-${i}`} fill={palette[i % palette.length]} />
                      ))}
                    </RC.Pie>
                    <RC.Tooltip content={({active,payload}:any)=> active && payload?.length ? (
                      <div className="tooltip">
                        <div className="title">{payload[0].name}</div>
                        <div className="row"><span>HT</span><span>{fmt(payload[0].value)}</span></div>
                      </div>
                    ) : null} />
                    <RC.Legend />
                  </RC.PieChart>
                </RC.ResponsiveContainer>
              ) : <div className="alert">Chargement du module graphiques…</div>}
              {RC && pieData.every((d:any)=> (d.value||0) === 0) && (
                <div className="alert" style={{ marginTop: 8 }}>Aucune donnée pour {month}.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
