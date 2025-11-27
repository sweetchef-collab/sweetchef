'use client';

import * as XLSX from 'xlsx';

type Row = { fam: string; total: number };

export default function KpiTable({ rows }: { rows: Row[] }) {
  function exportXlsx() {
    const data = [
      ['Famille des clients', 'Total ventes'],
      ...rows.map((r) => [r.fam, r.total])
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'KPI');
    XLSX.writeFile(wb, 'kpi_ventes_par_famille.xlsx');
  }

  return (
    <>
      <div className="actions">
        <button className="btn" type="button" onClick={exportXlsx}>Exporter XLSX</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Famille des clients</th>
            <th style={{ textAlign: 'right' }}>Total ventes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.fam}>
              <td>{r.fam}</td>
              <td style={{ textAlign: 'right' }}>{r.total.toLocaleString('fr-FR')}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={2}>
                <div className="alert">Aucune donnée disponible. Importez des ventes via la page dédiée.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

