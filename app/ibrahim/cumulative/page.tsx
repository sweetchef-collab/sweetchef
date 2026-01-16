import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import CumulativeViewer from './CumulativeViewer';

export const revalidate = 0;

export default async function IbrahimCumulativePage() {
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date', { ascending: true });

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>
            Espace Direction - Cumul
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/ibrahim" className="btn secondary">Retour</Link>
          <a href="/api/logout" className="btn secondary">Déconnexion</a>
        </div>
      </div>

      <div className="panel">
        <h1 className="title">Données sur une période</h1>
        <p className="subtitle">
          Sélectionnez une période ou un mois complet pour voir les cumuls (CA, marge, clients, trésorerie, stocks, fournisseurs, dettes financières et EBE).
        </p>

        <CumulativeViewer data={metrics || []} />
      </div>
    </div>
  );
}
