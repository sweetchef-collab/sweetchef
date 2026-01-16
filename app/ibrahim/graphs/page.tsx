import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import FinancialCharts from '../../_components/FinancialCharts';
import Link from 'next/link';

export const revalidate = 0;

export default async function IbrahimGraphsPage() {
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date', { ascending: true });

  const withBe = (metrics || []).map((row: any) => {
    const receivablesDue = row.receivables_due ?? 0;
    const receivablesCurrent = row.receivables_current ?? 0;
    const payablesDue = row.payables_due ?? 0;
    const payablesCurrent = row.payables_current ?? 0;
    const cashLcl = row.cash_lcl ?? 0;
    const cashCoop = row.cash_coop ?? 0;
    const cashBpmed = row.cash_bpmed ?? 0;

    const receivablesTotal = receivablesDue + receivablesCurrent || row.receivables || 0;
    const payablesTotal = payablesDue + payablesCurrent || row.payables || 0;
    const cashTotal = cashLcl + cashCoop + cashBpmed || row.cash || 0;

    const assets = receivablesTotal + cashTotal + (row.stock || 0);
    const liabilities = payablesTotal + (row.financial_debts || 0);

    return {
      ...row,
      be: assets - liabilities,
    };
  });

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
        <p className="subtitle">Visualisation des indicateurs clés et du BE journalier.</p>

        {withBe && withBe.length > 0 ? (
          <FinancialCharts data={withBe} />
        ) : (
             <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée financière disponible pour le moment.</div>
        )}
      </div>
    </div>
  );
}
