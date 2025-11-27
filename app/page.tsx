import Link from 'next/link';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
        <a className="btn secondary" href="/api/logout">Déconnexion</a>
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
      </div>

      <h2 className="title" style={{ marginTop: 24 }}>KPI</h2>
      <div className="tiles">
        <Link className="tile" href="/kpi">
          <div className="tile-icon">📊</div>
          <div className="tile-title">KPI Ventes</div>
        </Link>
        <Link className="tile" href="/kpi-sans-vendeur">
          <div className="tile-icon">📊</div>
          <div className="tile-title">KPI Ventes NV</div>
        </Link>
      </div>
    </div>
  );
}
