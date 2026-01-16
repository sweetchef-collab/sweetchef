'use client';

import { useMemo, useState } from 'react';

type MetricData = {
  date: string;
  revenue: number;
  margin: number;
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
  return { be: assets - liabilities, receivablesTotal, payablesTotal, cashTotal, assets, liabilities };
}

export default function CumulativeViewer({ data }: { data: MetricData[] }) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [data]
  );

  const [from, setFrom] = useState(sorted[0]?.date ?? '');
  const [to, setTo] = useState(sorted[sorted.length - 1]?.date ?? '');

  const handleFullMonth = () => {
    if (!sorted.length) return;
    const ref = to || sorted[sorted.length - 1].date;
    const d = new Date(ref);
    if (isNaN(d.getTime())) return;
    const y = d.getFullYear();
    const m = d.getMonth();
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    const isoStart = start.toISOString().slice(0, 10);
    const isoEnd = end.toISOString().slice(0, 10);
    const maxDate = sorted[sorted.length - 1].date;
    setFrom(isoStart);
    setTo(isoEnd > maxDate ? maxDate : isoEnd);
  };

  const filtered = useMemo(() => {
    if (!from || !to) return [];
    const fromTs = new Date(from).getTime();
    const toTs = new Date(to).getTime();
    return sorted.filter((r) => {
      const t = new Date(r.date).getTime();
      return t >= fromTs && t <= toTs;
    });
  }, [sorted, from, to]);

  const fmt = (val: number) =>
    val?.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });

  if (!sorted.length) {
    return <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée disponible.</div>;
  }

  return (
    <div style={{ marginTop: '24px', display: 'grid', gap: '24px' }}>
      <div
        className="card"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}
      >
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Filtre par période</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Du</span>
            <input
              type="date"
              value={from}
              min={sorted[0]?.date}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Au</span>
            <input
              type="date"
              value={to}
              min={from}
              max={sorted[sorted.length - 1]?.date}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleFullMonth}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Mois complet
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Données jour par jour</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Période du {new Date(from).toLocaleDateString('fr-FR')} au{' '}
              {new Date(to).toLocaleDateString('fr-FR')}
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Jours affichés : {filtered.length}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>CA</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Marge</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Clients (total)</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Trésorerie totale</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Stocks</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Fournisseurs (total)</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Dettes financières</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>BE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const { be, receivablesTotal, payablesTotal, cashTotal } = calcBe(row);
              const positive = be >= 0;
              return (
                <tr key={row.date} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                    {new Date(row.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(row.revenue || 0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(row.margin || 0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(receivablesTotal)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(cashTotal)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(row.stock || 0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(payablesTotal)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{fmt(row.financial_debts || 0)}</td>
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
            {!filtered.length && (
              <tr>
                <td colSpan={9} style={{ padding: '12px' }}>
                  <div className="alert">Aucune donnée pour cette période.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
