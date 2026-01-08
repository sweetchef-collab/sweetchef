'use client';

import { useState } from 'react';

type EbeData = {
  month: string;
  turnover: number;
  purchases: number;
  external_charges: number;
  salaries: number;
  production_taxes: number;
  ebe: number; // or calculated
  margin_percent: number; // or calculated
};

export default function EbeViewer({ data }: { data: EbeData[] }) {
  const sortedData = [...data].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

  const fmt = (val: number) => val?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  if (!sortedData.length) {
    return <div className="alert" style={{ marginTop: '32px' }}>Aucune donnée EBE disponible pour le moment.</div>;
  }

  return (
    <div style={{ marginTop: '32px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Mois</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Chiffre d'affaires</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#64748b' }}>Achats</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#64748b' }}>Ch. Externes</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#64748b' }}>Salaires</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#64748b' }}>Impôts</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}>EBE</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>% Marge</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => {
            // Recalculate if not present (safeguard)
            const charges = (row.purchases || 0) + (row.external_charges || 0) + (row.salaries || 0) + (row.production_taxes || 0);
            const ebe = row.ebe !== undefined ? row.ebe : (row.turnover - charges);
            const margin = row.margin_percent !== undefined ? row.margin_percent : (row.turnover ? (ebe / row.turnover) * 100 : 0);
            
            let color = '#eab308'; // yellow
            if (margin >= 5 && margin <= 15) color = '#16a34a'; // green
            else if (margin < 5) color = '#dc2626'; // red
            
            return (
              <tr key={row.month} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(row.month).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{fmt(row.turnover)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{fmt(row.purchases)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{fmt(row.external_charges)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{fmt(row.salaries)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{fmt(row.production_taxes)}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>{fmt(ebe)}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: color }}>
                    {margin.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
