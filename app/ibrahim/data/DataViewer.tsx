'use client';

import { useState } from 'react';

type MetricData = {
  date: string;
  revenue: number;
  margin: number;
  receivables: number;
  payables: number;
  cash: number;
  stock: number;
  financial_debts: number;
};

export default function DataViewer({ data }: { data: MetricData[] }) {
  // Sort data descending (newest first)
  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Default to newest date
  const [selectedDate, setSelectedDate] = useState<string>(sortedData.length > 0 ? sortedData[0].date : '');

  const currentData = sortedData.find(d => d.date === selectedDate);
  const fmt = (val: number) => val?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  if (!sortedData.length) {
    return <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée financière disponible pour le moment.</div>;
  }

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            <div className="card-title">Chiffre d'affaires</div>
            <div className="card-value">{fmt(currentData.revenue)}</div>
          </div>
          <div className="card">
            <div className="card-title">Marge</div>
            <div className="card-value" style={{ color: '#16a34a' }}>{fmt(currentData.margin)}</div>
          </div>
          <div className="card">
            <div className="card-title">Trésorerie</div>
            <div className="card-value" style={{ color: '#2563eb' }}>{fmt(currentData.cash)}</div>
          </div>
          <div className="card">
            <div className="card-title">Créances Clients</div>
            <div className="card-value">{fmt(currentData.receivables)}</div>
          </div>
          <div className="card">
            <div className="card-title">Dettes Fournisseurs</div>
            <div className="card-value">{fmt(currentData.payables)}</div>
          </div>
          <div className="card">
            <div className="card-title">Stocks</div>
            <div className="card-value">{fmt(currentData.stock)}</div>
          </div>
          <div className="card">
            <div className="card-title">Dettes Financières</div>
            <div className="card-value">{fmt(currentData.financial_debts)}</div>
          </div>
        </div>
      ) : (
        <div className="alert">Données introuvables pour cette date.</div>
      )}
    </div>
  );
}
