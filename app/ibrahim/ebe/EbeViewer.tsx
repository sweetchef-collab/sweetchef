'use client';

type MetricData = {
  date: string;
  receivables: number;
  receivables_due?: number;
  receivables_current?: number;
  payables: number;
  payables_due?: number;
  payables_current?: number;
  cash: number;
  cash_lcl?: number;
  cash_coop?: number;
  cash_bpmed?: number;
  stock: number;
  financial_debts: number;
};

function calcBe(row: MetricData) {
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
  const assets = receivablesTotal + cashTotal + row.stock;
  const liabilities = payablesTotal + row.financial_debts;
  return {
    assets,
    liabilities,
    be: assets - liabilities,
    receivablesTotal,
    payablesTotal,
    cashTotal,
  };
}

export default function EbeViewer({ data }: { data: MetricData[] }) {
  const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recent = sorted.slice(0, 60);

  const fmt = (val: number) =>
    val?.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });

  if (!recent.length) {
    return <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée disponible pour le BE.</div>;
  }

  return (
    <div style={{ marginTop: '32px', display: 'grid', gap: '24px' }}>
      <div
        className="card"
        style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}
      >
        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Formule du BE (position nette)</div>
        <p style={{ margin: '4px 0' }}>
          BE = Actifs d&apos;exploitation − Passifs d&apos;exploitation
        </p>
        <p style={{ margin: '4px 0' }}>
          Actifs = Clients échus + Clients en cours + Trésorerie LCL + Trésorerie Coop + Trésorerie BPMED + Stocks
        </p>
        <p style={{ margin: '4px 0' }}>
          Passifs = Fournisseurs échus + Fournisseurs en cours + Dettes financières
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
          Toutes les valeurs sont des montants de fin de journée tirés de la saisie journalière.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Clients (total)</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Trésorerie totale</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Stocks</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Actifs</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Fournisseurs (total)</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Dettes financières</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Passifs</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>BE</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => {
              const { assets, liabilities, be, receivablesTotal, payablesTotal, cashTotal } = calcBe(row);
              const positive = be >= 0;
              return (
                <tr key={row.date} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                    {new Date(row.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(receivablesTotal)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(cashTotal)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(row.stock || 0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{fmt(assets)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(payablesTotal)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(row.financial_debts || 0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{fmt(liabilities)}</td>
                  <td
                    style={{
                      padding: '10px',
                      textAlign: 'right',
                      fontWeight: 700,
                      color: positive ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {fmt(be)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
