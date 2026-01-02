import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import FinancialCharts from '../../_components/FinancialCharts';
import Link from 'next/link';

export const revalidate = 0;

export default async function IbrahimGraphsPage() {
  // Fetch daily metrics
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date', { ascending: true });

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="brand">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>Espace Direction - Graphiques</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/ibrahim" className="btn secondary">Retour</Link>
            <a href="/api/logout" className="btn secondary">Déconnexion</a>
        </div>
      </div>

      {/* Main Content */}
      <div className="panel">
        <h1 className="title">Évolution financière</h1>
        <p className="subtitle">Visualisation des indicateurs clés.</p>

        {/* Graphs Section */}
        {metrics && metrics.length > 0 ? (
          <FinancialCharts data={metrics} />
        ) : (
             <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée financière disponible pour le moment.</div>
        )}
      </div>
    </div>
  );
}
