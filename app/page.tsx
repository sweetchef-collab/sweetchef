'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Page() {
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState<boolean | null>(null);

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
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
        <div style={{ display:'flex', gap: 8 }}>
          <button className="btn" onClick={handleRefresh} disabled={refreshing}>{refreshing ? 'Rafraîchissement…' : 'Rafraîchir ventes–vendeur'}</button>
          <a className="btn secondary" href="/api/logout">Déconnexion</a>
        </div>
      </div>
      <div className="hero">
        <div className="hero-title">Tableau de bord</div>
      </div>

      <h2 className="title" style={{ marginTop: 8 }}>Imports</h2>
      <div className="tiles">
        <Link className="tile" href="/produit">
          <div className="tile-icon">📦</div>
          <div className="tile-title">Import Produit</div>
        </Link>
        <Link className="tile" href="/ventes-sans-vendeur">
          <div className="tile-icon">🧾</div>
          <div className="tile-title">Import Ventes NV</div>
        </Link>
        <Link className="tile" href="/client-vendeur">
          <div className="tile-icon">🤝</div>
          <div className="tile-title">Import Client–Vendeur</div>
        </Link>
      </div>

      <h2 className="title" style={{ marginTop: 24 }}>KPI</h2>
      <div className="tiles">
        <Link className="tile" href="/kpi-sans-vendeur">
          <div className="tile-icon">📊</div>
          <div className="tile-title">KPI Ventes NV</div>
        </Link>
        <Link className="tile" href="/kpi-carte">
          <div className="tile-icon">🗺️</div>
          <div className="tile-title">KPI Carte Clients</div>
        </Link>
      </div>
      <h2 className="title" style={{ marginTop: 24 }}>Graphique</h2>
      <div className="tiles">
        <Link className="tile" href="/kpi-graphiques">
          <div className="tile-icon">📉</div>
          <div className="tile-title">Graphique — Pôle</div>
          <div className="tile-desc">Courbes et barres par pôle (12 mois)</div>
        </Link>
        <Link className="tile" href="/graphique-vendeur">
          <div className="tile-icon">📈</div>
          <div className="tile-title">Graphique — Vendeur</div>
          <div className="tile-desc">Tendances mensuelles et répartition par vendeur</div>
        </Link>
      </div>

      <h2 className="title" style={{ marginTop: 24 }}>Infos</h2>
      <div className="tiles">
        <Link className="tile" href="/infos/clients">
          <div className="tile-icon">🗂️</div>
          <div className="tile-title">Infos — Clients</div>
          <div className="tile-desc">Liste code client, société, groupe, CP, ville, vendeur</div>
        </Link>
        <Link className="tile" href="/clients-inactifs">
          <div className="tile-icon">⏳</div>
          <div className="tile-title">Clients inactifs</div>
          <div className="tile-desc">Clients n'ayant pas commandé ce mois</div>
        </Link>
        <Link className="tile" href="/activite-clients">
          <div className="tile-icon">📈</div>
          <div className="tile-title">Activité — Clients</div>
          <div className="tile-desc">Agrégats et indicateurs Positif/Négatif par mois</div>
        </Link>
      </div>
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn" onClick={handleRefresh} disabled={refreshing}>{refreshing ? 'Rafraîchissement…' : 'Rafraîchir ventes–vendeur'}</button>
      </div>
      {status && (
        <div className="status">
          <div className={`alert ${ok ? 'success' : ok === false ? 'error' : ''}`}>{status}</div>
        </div>
      )}
    </div>
  );
}
