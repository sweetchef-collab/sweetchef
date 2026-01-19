'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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
  be?: number;
};

export default function FinancialCharts({ data }: { data: MetricData[] }) {
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = sortedData.map(d => ({
    ...d,
    avgBasket: d.order_count ? d.revenue / d.order_count : 0,
    receivables_due: d.receivables_due || 0,
    receivables_current: d.receivables_current || 0,
    payables_due: d.payables_due || 0,
    payables_current: d.payables_current || 0,
    cash_lcl: d.cash_lcl || 0,
    cash_coop: d.cash_coop || 0,
    cash_bpmed: d.cash_bpmed || 0
  }));

  // Helper for formatting currency
  const fmt = (val: number) => val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Évolution des Indicateurs Financiers</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
        
        {/* Revenue & Margin */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Chiffre d'affaires & Marge</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="CA" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="margin" name="Marge" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Count */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Nombre de commandes</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="order_count" name="Commandes" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Basket */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Panier Moyen</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="avgBasket" name="Panier Moyen" stroke="#ec4899" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Trésorerie (Détails)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="cash" name="Total" stroke="#0891b2" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="cash_lcl" name="LCL" stroke="#2563eb" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="cash_coop" name="Coop" stroke="#9333ea" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="cash_bpmed" name="BPMED" stroke="#db2777" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Debts */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Dettes Financières</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="financial_debts" name="Dettes Fin." stroke="#dc2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EBE */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>EBE (Position nette)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="be" name="EBE" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Receivables */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Créances Clients (Détails)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="receivables" name="Total" stroke="#9333ea" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="receivables_current" name="En cours" stroke="#c084fc" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="receivables_due" name="Échues" stroke="#7e22ce" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payables */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Dettes Fournisseurs (Détails)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="payables" name="Total" stroke="#ea580c" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="payables_current" name="En cours" stroke="#fb923c" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="payables_due" name="Échues" stroke="#c2410c" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Stocks</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="stock" name="Stocks" stroke="#ca8a04" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
