"use client";
import { useState } from 'react';

export default function RefreshButton() {
  const [refreshing, setRefreshing] = useState(false as boolean);
  const [status, setStatus] = useState('' as string);
  const [ok, setOk] = useState(null as boolean | null);

  async function handleRefresh() {
    setRefreshing(true);
    setOk(null);
    setStatus('Rafraîchissement…');
    try {
      const res = await fetch('/api/refresh-vente-vendeur', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setOk(false);
        setStatus(`Erreur: ${data.error || 'inconnue'}`);
      } else {
        setOk(true);
        setStatus(`Rafraîchi: ${data.rows ?? '—'} lignes`);
      }
    } catch (e: any) {
      setOk(false);
      setStatus(`Erreur réseau: ${e.message}`);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <button className="btn" onClick={handleRefresh} disabled={refreshing}>{refreshing ? 'Rafraîchissement…' : 'Rafraîchir ventes–vendeur'}</button>
      {status && (
        <div className="status">
          <div className={`alert ${ok ? 'success' : ok === false ? 'error' : ''}`}>{status}</div>
        </div>
      )}
    </div>
  );
}
