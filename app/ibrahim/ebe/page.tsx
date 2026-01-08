import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import EbeViewer from './EbeViewer';

export const revalidate = 0;

export default async function EbePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: ebeData, error } = await supabase
    .from('monthly_ebe')
    .select('*')
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching EBE data:', error);
  }

  return (
    <div className="container">
      {/* Header */}
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

      {/* Main Content */}
      <div className="panel" style={{ minHeight: '60vh' }}>
        <h1 className="title">Suivi EBE Mensuel</h1>
        <p className="subtitle">
            Excédent Brut d'Exploitation et Marge
        </p>

        <EbeViewer data={ebeData || []} />
      </div>
    </div>
  );
}
