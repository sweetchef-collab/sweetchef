import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export const revalidate = 0;

export default async function IbrahimDataPage() {
  // Fetch daily metrics
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date', { ascending: true });

  const sortedMetrics = metrics ? [...metrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
  const latest = sortedMetrics.length > 0 ? sortedMetrics[0] : null;

  const fmt = (val: number) => val?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="brand">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>Espace Direction - Données</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/ibrahim" className="btn secondary">Retour</Link>
            <a href="/api/logout" className="btn secondary">Déconnexion</a>
        </div>
      </div>

      {/* Main Content */}
      <div className="panel">
        <h1 className="title">Dernières données financières</h1>
        
        {/* Latest Info Section */}
        {latest ? (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>
              Mise à jour du {new Date(latest.date).toLocaleDateString('fr-FR')}
            </h2>
            <div className="grid">
              <div className="card">
                <div className="card-title">Chiffre d'affaires</div>
                <div className="card-value">{fmt(latest.revenue)}</div>
              </div>
              <div className="card">
                <div className="card-title">Marge</div>
                <div className="card-value" style={{ color: '#16a34a' }}>{fmt(latest.margin)}</div>
              </div>
              <div className="card">
                <div className="card-title">Trésorerie</div>
                <div className="card-value" style={{ color: '#2563eb' }}>{fmt(latest.cash)}</div>
              </div>
              <div className="card">
                <div className="card-title">Créances Clients</div>
                <div className="card-value">{fmt(latest.receivables)}</div>
              </div>
              <div className="card">
                <div className="card-title">Dettes Fournisseurs</div>
                <div className="card-value">{fmt(latest.payables)}</div>
              </div>
              <div className="card">
                <div className="card-title">Stocks</div>
                <div className="card-value">{fmt(latest.stock)}</div>
              </div>
              <div className="card">
                <div className="card-title">Dettes Financières</div>
                <div className="card-value">{fmt(latest.debt)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée financière disponible pour le moment.</div>
        )}
      </div>
    </div>
  );
}
