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
  payables: number;
  cash: number;
  stock: number;
  financial_debts: number;
  be?: number;
};

export default function FinancialCharts({ data }: { data: MetricData[] }) {
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = sortedData.map(d => ({
    ...d,
    avgBasket: d.order_count ? d.revenue / d.order_count : 0
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

        {/* Cash, Dettes & EBE */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Trésorerie, Dettes Financières & EBE</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="cash" name="Trésorerie" stroke="#0891b2" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="financial_debts" name="Dettes Fin." stroke="#dc2626" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="be" name="EBE (position nette)" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Receivables & Payables */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '600' }}>Balance Clients & Fournisseurs</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${v/1000}k` : v.toString()} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="receivables" name="Clients (Créances)" stroke="#9333ea" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="payables" name="Fournisseurs (Dettes)" stroke="#ea580c" strokeWidth={2} dot={false} />
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
