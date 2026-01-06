import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import ComparisonViewer from './ComparisonViewer';

export const revalidate = 0;

export default async function IbrahimComparisonPage() {
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
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>Espace Direction - Comparatif</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/ibrahim" className="btn secondary">Retour</Link>
            <a href="/api/logout" className="btn secondary">Déconnexion</a>
        </div>
      </div>

      {/* Main Content */}
      <div className="panel">
        <h1 className="title">Comparatif Financier</h1>
        <p className="subtitle">Analysez l'évolution entre deux dates.</p>
        
        <ComparisonViewer data={metrics || []} />
      </div>
    </div>
  );
}
