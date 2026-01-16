import Image from 'next/image';
import Link from 'next/link';

export default function IbrahimDashboard() {
  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="brand">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>Espace Direction</div>
        </div>
        <a href="/api/logout" className="btn secondary">Déconnexion</a>
      </div>

      {/* Main Content */}
      <div className="panel" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="title" style={{ marginBottom: '2rem' }}>Bienvenue Ibrahim</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%', maxWidth: '800px' }}>
            
            <Link href="/ibrahim/data" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ 
                    cursor: 'pointer', 
                    padding: '2rem', 
                    textAlign: 'center', 
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem'
                }}
                >
                    <div style={{ fontSize: '3rem' }}>📊</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Données Financières</h2>
                    <p style={{ color: 'var(--text-light)' }}>Consulter les derniers chiffres clés (CA, Marge, Trésorerie...)</p>
                </div>
            </Link>

            <Link href="/ibrahim/graphs" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ 
                    cursor: 'pointer', 
                    padding: '2rem', 
                    textAlign: 'center', 
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem'
                }}
                >
                    <div style={{ fontSize: '3rem' }}>📈</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Graphiques d'Évolution</h2>
                    <p style={{ color: 'var(--text-light)' }}>Visualiser l'évolution des performances dans le temps.</p>
                </div>
            </Link>

            <Link href="/ibrahim/comparison" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ 
                    cursor: 'pointer', 
                    padding: '2rem', 
                    textAlign: 'center', 
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem'
                }}
                >
                    <div style={{ fontSize: '3rem' }}>⚖️</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Comparatif</h2>
                    <p style={{ color: 'var(--text-light)' }}>Comparer les performances entre deux dates.</p>
                </div>
            </Link>

            <Link href="/ibrahim/cumulative" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ 
                    cursor: 'pointer', 
                    padding: '2rem', 
                    textAlign: 'center', 
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem'
                }}
                >
                    <div style={{ fontSize: '3rem' }}>🧮</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Cumul sur période</h2>
                    <p style={{ color: 'var(--text-light)' }}>Voir les totaux entre deux dates ou sur un mois complet.</p>
                </div>
            </Link>

            <Link href="/ibrahim/ebe" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ 
                    cursor: 'pointer', 
                    padding: '2rem', 
                    textAlign: 'center', 
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem'
                }}
                >
                    <div style={{ fontSize: '3rem' }}>💰</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>BE (Position nette)</h2>
                    <p style={{ color: 'var(--text-light)' }}>Comprendre le calcul du BE et consulter le détail jour par jour.</p>
                </div>
            </Link>

        </div>
      </div>
    </div>
  );
}
