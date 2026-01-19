'use client';

import { useMemo, useState } from 'react';

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

  const totals = useMemo(() => {
    // 1. Accumulate Flow Metrics (Revenue, Margin, Order Count)
    let revenue = 0;
    let order_count = 0;
    let margin = 0;

    for (const r of filtered) {
      revenue += r.revenue || 0;
      order_count += r.order_count || 0;
      margin += r.margin || 0;
    }

    // 2. Snapshot Metrics (Last available data point in the period)
    // "tout le reste n'est pas cumulatif" -> Use the value from the last day of the selected period.
    const lastRecord = filtered.length > 0 ? filtered[filtered.length - 1] : null;

    const receivablesDue = lastRecord?.receivables_due ?? 0;
    const receivablesCurrent = lastRecord?.receivables_current ?? 0;
    const receivablesTotal = receivablesDue + receivablesCurrent || lastRecord?.receivables || 0;

    const payablesDue = lastRecord?.payables_due ?? 0;
    const payablesCurrent = lastRecord?.payables_current ?? 0;
    const payablesTotal = payablesDue + payablesCurrent || lastRecord?.payables || 0;

    const cashLcl = lastRecord?.cash_lcl ?? 0;
    const cashCoop = lastRecord?.cash_coop ?? 0;
    const cashBpmed = lastRecord?.cash_bpmed ?? 0;
    const cashTotal = cashLcl + cashCoop + cashBpmed || lastRecord?.cash || 0;

    const stock = lastRecord?.stock || 0;
    const debts = lastRecord?.financial_debts || 0;

    return { 
      revenue, 
      order_count, 
      margin, 
      receivablesDue,
      receivablesCurrent,
      receivablesTotal, 
      payablesDue,
      payablesCurrent,
      payablesTotal, 
      cashLcl,
      cashCoop,
      cashBpmed,
      cashTotal, 
      stock, 
      debts 
    };
  }, [filtered]);

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
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Période cumulative</div>
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

      <div className="grid">
        <div className="card">
          <div className="card-title">CA cumulé</div>
          <div className="card-value">{fmt(totals.revenue)}</div>
        </div>
        <div className="card">
          <div className="card-title">Marge cumulée</div>
          <div className="card-value" style={{ color: '#16a34a' }}>
            {fmt(totals.margin)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Nombre de commandes</div>
          <div className="card-value">{totals.order_count}</div>
        </div>
        <div className="card">
          <div className="card-title">Panier Moyen (Période)</div>
          <div className="card-value">
            {fmt(totals.order_count ? totals.revenue / totals.order_count : 0)}
          </div>
        </div>

        {/* Detailed Breakdown for Snapshot Metrics */}
        <div className="card">
          <div className="card-title">Créances Clients échues</div>
          <div className="card-value">{fmt(totals.receivablesDue)}</div>
        </div>
        <div className="card">
          <div className="card-title">Créances Clients en cours</div>
          <div className="card-value">{fmt(totals.receivablesCurrent)}</div>
        </div>
        <div className="card">
          <div className="card-title">Créances Clients (total)</div>
          <div className="card-value">{fmt(totals.receivablesTotal)}</div>
        </div>

        <div className="card">
          <div className="card-title">Dettes Fournisseurs échues</div>
          <div className="card-value">{fmt(totals.payablesDue)}</div>
        </div>
        <div className="card">
          <div className="card-title">Dettes Fournisseurs en cours</div>
          <div className="card-value">{fmt(totals.payablesCurrent)}</div>
        </div>
        <div className="card">
          <div className="card-title">Dettes Fournisseurs (total)</div>
          <div className="card-value">{fmt(totals.payablesTotal)}</div>
        </div>

        <div className="card">
          <div className="card-title">Trésorerie LCL</div>
          <div className="card-value" style={{ color: '#2563eb' }}>{fmt(totals.cashLcl)}</div>
        </div>
        <div className="card">
          <div className="card-title">Trésorerie Coop</div>
          <div className="card-value" style={{ color: '#2563eb' }}>{fmt(totals.cashCoop)}</div>
        </div>
        <div className="card">
          <div className="card-title">Trésorerie BPMED</div>
          <div className="card-value" style={{ color: '#2563eb' }}>{fmt(totals.cashBpmed)}</div>
        </div>
        <div className="card">
          <div className="card-title">Trésorerie totale</div>
          <div className="card-value" style={{ color: '#1d4ed8' }}>
            {fmt(totals.cashTotal)}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Stocks</div>
          <div className="card-value">{fmt(totals.stock)}</div>
        </div>
        <div className="card">
          <div className="card-title">Dettes financières</div>
          <div className="card-value">{fmt(totals.debts)}</div>
        </div>
      </div>
    </div>
  );
}
