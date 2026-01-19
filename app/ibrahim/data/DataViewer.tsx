'use client';

import { useState } from 'react';

type MetricData = {
  date: string;
  revenue: number;
  order_count?: number;
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

export default function DataViewer({ data }: { data: MetricData[] }) {
  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [selectedDate, setSelectedDate] = useState<string>(sortedData.length > 0 ? sortedData[0].date : '');

  const currentData = sortedData.find(d => d.date === selectedDate);
  const fmt = (val: number) => val?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const calcBe = (row: MetricData | undefined) => {
    if (!row) return 0;
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
    return assets - liabilities;
  };

  if (!sortedData.length) {
    return <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée financière disponible pour le moment.</div>;
  }

  const beCurrent = calcBe(currentData);
  const bePositive = beCurrent >= 0;

  return (
    <div style={{ marginTop: '32px' }}>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label htmlFor="date-select" style={{ fontWeight: 'bold' }}>Choisir une date :</label>
          <select 
            id="date-select"
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
          >
            {sortedData.map((d) => (
              <option key={d.date} value={d.date}>
                {new Date(d.date).toLocaleDateString('fr-FR')}
              </option>
            ))}
          </select>
        </div>

        {currentData ? (
          <div className="grid">
            <div className="card">
              <div className="card-title">Chiffre d'affaires (journée)</div>
              <div className="card-value">{fmt(currentData.revenue)}</div>
            </div>
            <div className="card">
              <div className="card-title">Marge (journée)</div>
              <div className="card-value" style={{ color: '#16a34a' }}>{fmt(currentData.margin)}</div>
            </div>
            <div className="card">
              <div className="card-title">Nombre de commandes</div>
              <div className="card-value">{currentData.order_count || 0}</div>
            </div>
            <div className="card">
              <div className="card-title">Panier Moyen</div>
              <div className="card-value">
                {fmt(currentData.order_count ? currentData.revenue / currentData.order_count : 0)}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Créances Clients échues</div>
              <div className="card-value">{fmt(currentData.receivables_due ?? 0)}</div>
            </div>
            <div className="card">
              <div className="card-title">Créances Clients en cours</div>
              <div className="card-value">{fmt(currentData.receivables_current ?? 0)}</div>
            </div>
            <div className="card">
              <div className="card-title">Créances Clients (total)</div>
              <div className="card-value">
                {fmt(
                  (currentData.receivables_due ?? 0) + (currentData.receivables_current ?? 0) || currentData.receivables || 0
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Dettes Fournisseurs échues</div>
              <div className="card-value">{fmt(currentData.payables_due ?? 0)}</div>
            </div>
            <div className="card">
              <div className="card-title">Dettes Fournisseurs en cours</div>
              <div className="card-value">{fmt(currentData.payables_current ?? 0)}</div>
            </div>
            <div className="card">
              <div className="card-title">Dettes Fournisseurs (total)</div>
              <div className="card-value">
                {fmt(
                  (currentData.payables_due ?? 0) + (currentData.payables_current ?? 0) || currentData.payables || 0
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Trésorerie LCL</div>
              <div className="card-value" style={{ color: '#2563eb' }}>{fmt(currentData.cash_lcl ?? 0)}</div>
            </div>
            <div className="card">
              <div className="card-title">Trésorerie Coop</div>
              <div className="card-value" style={{ color: '#2563eb' }}>{fmt(currentData.cash_coop ?? 0)}</div>
            </div>
            <div className="card">
              <div className="card-title">Trésorerie BPMED</div>
              <div className="card-value" style={{ color: '#2563eb' }}>{fmt(currentData.cash_bpmed ?? 0)}</div>
            </div>
            <div className="card">
              <div className="card-title">Trésorerie totale</div>
              <div className="card-value" style={{ color: '#1d4ed8' }}>
                {fmt(
                  (currentData.cash_lcl ?? 0) +
                  (currentData.cash_coop ?? 0) +
                  (currentData.cash_bpmed ?? 0) ||
                  currentData.cash ||
                  0
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Stocks</div>
              <div className="card-value">{fmt(currentData.stock)}</div>
            </div>
            <div className="card">
              <div className="card-title">Dettes Financières</div>
              <div className="card-value">{fmt(currentData.financial_debts)}</div>
            </div>
            <div className="card">
              <div className="card-title">BE (position nette de la journée)</div>
              <div
                className="card-value"
                style={{ color: bePositive ? '#16a34a' : '#dc2626' }}
              >
                {fmt(beCurrent)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                {bePositive ? 'Position positive' : 'Position négative'}
              </div>
            </div>
          </div>
        ) : (
          <div className="alert">Données introuvables pour cette date.</div>
        )}
      </div>

    </div>
  );
}
