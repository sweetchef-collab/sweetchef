'use client';

import { useState } from 'react';

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

export default function ComparisonViewer({ data }: { data: MetricData[] }) {
  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [dateA, setDateA] = useState<string>(sortedData.length > 0 ? sortedData[0].date : '');
  const [dateB, setDateB] = useState<string>(sortedData.length > 1 ? sortedData[1].date : (sortedData.length > 0 ? sortedData[0].date : ''));

  const dataA = sortedData.find(d => d.date === dateA);
  const dataB = sortedData.find(d => d.date === dateB);

  const fmt = (val: number) => val?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const fmtDiff = (val: number) => (val > 0 ? '+' : '') + val?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  if (!sortedData.length) {
    return <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée financière disponible pour le moment.</div>;
  }

  const renderRow = (title: string, valA: number, valB: number, inverseColor: boolean = false) => {
    const diff = valA - valB;
    let color = 'inherit';
    if (diff > 0) color = inverseColor ? '#dc2626' : '#16a34a';
    if (diff < 0) color = inverseColor ? '#16a34a' : '#dc2626';
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';

    return (
      <div style={{ display: 'contents' }}>
        <div style={{ padding: '10px 12px' }}>{title}</div>
        <div style={{ padding: '10px 12px', fontWeight: 600 }}>{fmt(valB)}</div>
        <div style={{ padding: '10px 12px', fontWeight: 600 }}>{fmt(valA)}</div>
        <div style={{ padding: '10px 12px', fontWeight: 700, color }}>{arrow} {fmtDiff(diff)}</div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '24px', display: 'grid', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ display: 'grid', gap: '10px' }}>
          <div style={{ fontWeight: 700 }}>Date de départ (B)</div>
          <select
            id="date-b"
            value={dateB}
            onChange={(e) => setDateB(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '1rem' }}
          >
            {sortedData.map((d) => (
              <option key={d.date} value={d.date}>
                {new Date(d.date).toLocaleDateString('fr-FR')}
              </option>
            ))}
          </select>
        </div>
        <div className="card" style={{ display: 'grid', gap: '10px' }}>
          <div style={{ fontWeight: 700 }}>Date d'arrivée (A)</div>
          <select
            id="date-a"
            value={dateA}
            onChange={(e) => setDateA(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '1rem' }}
          >
            {sortedData.map((d) => (
              <option key={d.date} value={d.date}>
                {new Date(d.date).toLocaleDateString('fr-FR')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Résumé comparatif</div>
            {dataB && <span style={{ background: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: '999px', fontSize: '0.85rem' }}>{new Date(dateB).toLocaleDateString('fr-FR')}</span>}
            <span style={{ color: '#64748b' }}>→</span>
            {dataA && <span style={{ background: '#ecfeff', color: '#0e7490', padding: '4px 10px', borderRadius: '999px', fontSize: '0.85rem' }}>{new Date(dateA).toLocaleDateString('fr-FR')}</span>}
          </div>
        </div>
        {dataA && dataB ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ padding: '12px', fontSize: '0.9rem', color: '#64748b' }}>Indicateur</div>
            <div style={{ padding: '12px', fontSize: '0.9rem', color: '#64748b' }}>{new Date(dateB).toLocaleDateString('fr-FR')}</div>
            <div style={{ padding: '12px', fontSize: '0.9rem', color: '#64748b' }}>{new Date(dateA).toLocaleDateString('fr-FR')}</div>
            <div style={{ padding: '12px', fontSize: '0.9rem', color: '#64748b' }}>Différence</div>

            {renderRow("Chiffre d'affaires (journée)", dataA.revenue, dataB.revenue)}
            {renderRow("Marge (journée)", dataA.margin, dataB.margin)}

            {renderRow(
              "Créances Clients échues",
              dataA.receivables_due ?? 0,
              dataB.receivables_due ?? 0
            )}
            {renderRow(
              "Créances Clients en cours",
              dataA.receivables_current ?? 0,
              dataB.receivables_current ?? 0
            )}
            {renderRow(
              "Créances Clients (total)",
              (dataA.receivables_due ?? 0) + (dataA.receivables_current ?? 0) || dataA.receivables,
              (dataB.receivables_due ?? 0) + (dataB.receivables_current ?? 0) || dataB.receivables
            )}

            {renderRow(
              "Dettes Fournisseurs échues",
              dataA.payables_due ?? 0,
              dataB.payables_due ?? 0,
              true
            )}
            {renderRow(
              "Dettes Fournisseurs en cours",
              dataA.payables_current ?? 0,
              dataB.payables_current ?? 0,
              true
            )}
            {renderRow(
              "Dettes Fournisseurs (total)",
              (dataA.payables_due ?? 0) + (dataA.payables_current ?? 0) || dataA.payables,
              (dataB.payables_due ?? 0) + (dataB.payables_current ?? 0) || dataB.payables,
              true
            )}

            {renderRow(
              "Trésorerie LCL",
              dataA.cash_lcl ?? 0,
              dataB.cash_lcl ?? 0
            )}
            {renderRow(
              "Trésorerie Coop",
              dataA.cash_coop ?? 0,
              dataB.cash_coop ?? 0
            )}
            {renderRow(
              "Trésorerie BPMED",
              dataA.cash_bpmed ?? 0,
              dataB.cash_bpmed ?? 0
            )}
            {renderRow(
              "Trésorerie totale",
              (dataA.cash_lcl ?? 0) + (dataA.cash_coop ?? 0) + (dataA.cash_bpmed ?? 0) || dataA.cash,
              (dataB.cash_lcl ?? 0) + (dataB.cash_coop ?? 0) + (dataB.cash_bpmed ?? 0) || dataB.cash
            )}

            {renderRow("Stocks", dataA.stock, dataB.stock)}
            {renderRow("Dettes Financières", dataA.financial_debts, dataB.financial_debts, true)}
          </div>
        ) : (
          <div className="alert">Veuillez sélectionner deux dates valides.</div>
        )}
      </div>
    </div>
  );
}
