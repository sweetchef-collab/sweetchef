import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import EbeViewer from './EbeViewer';

export const revalidate = 0;

export default async function BePage() {
  const { data: metrics, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Erreur lors du chargement des données BE :', error);
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>
            <Link href="/ibrahim" style={{ textDecoration: 'none', color: 'inherit' }}>
              Espace Direction
            </Link>
            {' > '} EBE
          </div>
        </div>
        <Link href="/ibrahim" className="btn secondary">Retour Dashboard</Link>
      </div>

      <div className="panel" style={{ minHeight: '60vh' }}>
        <h1 className="title">EBE journalier (position nette)</h1>
        <p className="subtitle">
          Vue dédiée à l&apos;EBE, avec la formule détaillée et un tableau jour par jour.
        </p>

        <EbeViewer data={metrics || []} />
      </div>
    </div>
  );
}
