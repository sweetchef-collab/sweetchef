"use client";
import { useMemo, useState } from 'react';

type Row = { code_client: string | null; societe: string | null; nom: string | null; prenom: string | null; groupe: string | null; code_postal: string | null; ville: string | null };

export default function IchamClientsList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState('');
  const [ville, setVille] = useState('');
  const [groupe, setGroupe] = useState('');

  const villes = useMemo(() => Array.from(new Set((rows||[]).map(r => (r.ville||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b)), [rows]);
  const groupes = useMemo(() => Array.from(new Set((rows||[]).map(r => (r.groupe||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b)), [rows]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (rows || []).filter(r => {
      const matchesVille = !ville || (r.ville||'') === ville;
      const matchesGroupe = !groupe || (r.groupe||'') === groupe;
      const hay = [r.code_client, r.societe, r.nom, r.prenom, r.ville, r.groupe].map(v => (v||'').toLowerCase()).join(' ');
      const matchesQ = !qq || hay.includes(qq);
      return matchesVille && matchesGroupe && matchesQ;
    });
  }, [rows, q, ville, groupe]);

  return (
    <div className="section">
      <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input className="input" placeholder="Recherche (code, société, ville)" value={q} onChange={(e)=> setQ(e.target.value)} />
          <select className="input" value={ville} onChange={(e)=> setVille(e.target.value)}>
            <option value="">Ville</option>
            {villes.map(v => (<option key={v} value={v}>{v}</option>))}
          </select>
          <select className="input" value={groupe} onChange={(e)=> setGroupe(e.target.value)}>
            <option value="">Groupe</option>
            {groupes.map(g => (<option key={g} value={g}>{g}</option>))}
          </select>
        </div>
        <div className="kpi-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="kpi-card"><div className="kpi-label">Clients</div><div className="kpi-value">{rows.length}</div></div>
          <div className="kpi-card"><div className="kpi-label">Filtrés</div><div className="kpi-value">{filtered.length}</div></div>
          <div className="kpi-card"><div className="kpi-label">Villes</div><div className="kpi-value">{villes.length}</div></div>
        </div>
      </div>

      <div style={{ maxHeight: '65vh', overflow:'auto', borderRadius: 12, border: '1px solid var(--border)', marginTop: 12 }}>
        <table className="table" style={{ marginTop: 0, minWidth: 1000 }}>
          <thead>
            <tr>
              <th>Code client</th>
              <th>Société</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Groupe</th>
              <th>Code postal</th>
              <th>Ville</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td>{r.code_client ?? '—'}</td>
                <td>{r.societe ?? '—'}</td>
                <td>{r.nom ?? '—'}</td>
                <td>{r.prenom ?? '—'}</td>
                <td>{r.groupe ?? '—'}</td>
                <td>{r.code_postal ?? '—'}</td>
                <td>{r.ville ?? '—'}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7}><div className="alert">Aucun client.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
