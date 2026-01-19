'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function DataEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [date, setDate] = useState(dateParam || new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    revenue: '',
    order_count: '',
    margin: '',
    receivables_due: '',
    receivables_current: '',
    payables_due: '',
    payables_current: '',
    cash_lcl: '',
    cash_coop: '',
    cash_bpmed: '',
    stock: '',
    financial_debts: '',
  });

  useEffect(() => {
    if (dateParam) {
        fetchDataForDate(dateParam);
    }
  }, [dateParam]);

  const fetchDataForDate = async (targetDate: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('date', targetDate)
      .single();
    
    if (data) {
        setFormData({
            revenue: data.revenue || '',
            order_count: data.order_count || '',
            margin: data.margin || '',
            receivables_due: data.receivables_due || '',
            receivables_current: data.receivables_current || '',
            payables_due: data.payables_due || '',
            payables_current: data.payables_current || '',
            cash_lcl: data.cash_lcl || '',
            cash_coop: data.cash_coop || '',
            cash_bpmed: data.cash_bpmed || '',
            stock: data.stock || '',
            financial_debts: data.financial_debts || '',
        });
        setDate(targetDate);
        setMessage({ type: 'success', text: `Données chargées pour le ${new Date(targetDate).toLocaleDateString('fr-FR')}.` });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const receivables_due = parseFloat(formData.receivables_due) || 0;
      const receivables_current = parseFloat(formData.receivables_current) || 0;
      const payables_due = parseFloat(formData.payables_due) || 0;
      const payables_current = parseFloat(formData.payables_current) || 0;
      const cash_lcl = parseFloat(formData.cash_lcl) || 0;
      const cash_coop = parseFloat(formData.cash_coop) || 0;
      const cash_bpmed = parseFloat(formData.cash_bpmed) || 0;

      const totalReceivables = receivables_due + receivables_current;
      const totalPayables = payables_due + payables_current;
      const totalCash = cash_lcl + cash_coop + cash_bpmed;

      const dataToSubmit = {
        date,
        revenue: parseFloat(formData.revenue) || 0,
        order_count: parseFloat(formData.order_count) || 0,
        margin: parseFloat(formData.margin) || 0,
        receivables: totalReceivables,
        payables: totalPayables,
        cash: totalCash,
        receivables_due,
        receivables_current,
        payables_due,
        payables_current,
        cash_lcl,
        cash_coop,
        cash_bpmed,
        stock: parseFloat(formData.stock) || 0,
        financial_debts: parseFloat(formData.financial_debts) || 0,
      };

      const { data: existing } = await supabase
        .from('daily_metrics')
        .select('id')
        .eq('date', date)
        .single();

      let error;
      if (existing) {
        const res = await supabase
          .from('daily_metrics')
          .update(dataToSubmit)
          .eq('id', existing.id);
        error = res.error;
      } else {
        const res = await supabase
          .from('daily_metrics')
          .insert([dataToSubmit]);
        error = res.error;
      }

      if (error) throw error;

      setMessage({ type: 'success', text: 'Données enregistrées avec succès.' });
    } catch (err: any) {
      console.error(err);
      let msg = err.message;
      if (msg === 'Failed to fetch') {
        msg = "Impossible de se connecter à la base de données. Vérifiez votre connexion internet ou les identifiants Supabase (URL/Clé) dans le fichier .env.local.";
      }
      setMessage({ type: 'error', text: 'Erreur : ' + msg });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: '#fff',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>Espace Saisie</div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => router.push('/data-entry/history')} className="btn secondary">
                Voir l'historique
            </button>
            <a href="/api/logout" className="btn secondary">Déconnexion</a>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="title">Saisie Journalière</h1>
        <p className="subtitle" style={{ marginBottom: '32px' }}>
          Remplissez les indicateurs financiers de la journée (montants journaliers, pas cumulés).
        </p>

        <form onSubmit={handleSubmit}>
          {/* Date Section */}
          <div className="section" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--muted)', fontSize: '14px' }}>Date de référence</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid">
            {[
              { label: "Chiffre d'affaires (de la journée)", name: 'revenue', placeholder: '0.00' },
              { label: "Nombre de commandes", name: 'order_count', placeholder: '0' },
              { label: "Marge (de la journée)", name: 'margin', placeholder: '0.00' },
              { label: "Balance clients échus", name: 'receivables_due', placeholder: '0.00' },
              { label: "Balance clients en cours", name: 'receivables_current', placeholder: '0.00' },
              { label: "Balance fournisseurs échus", name: 'payables_due', placeholder: '0.00' },
              { label: "Balance fournisseurs en cours", name: 'payables_current', placeholder: '0.00' },
              { label: "Trésorerie LCL", name: 'cash_lcl', placeholder: '0.00' },
              { label: "Trésorerie Coop", name: 'cash_coop', placeholder: '0.00' },
              { label: "Trésorerie BPMED", name: 'cash_bpmed', placeholder: '0.00' },
              { label: "Stocks", name: 'stock', placeholder: '0.00' },
              { label: "Dettes financières", name: 'financial_debts', placeholder: '0.00' },
            ].map((field) => (
              <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 600, color: 'var(--muted)', fontSize: '14px' }}>{field.label}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    name={field.name}
                    value={(formData as any)[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    step="0.01"
                    style={inputStyle}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>€</span>
                </div>
              </div>
            ))}
          </div>

          <div className="actions" style={{ marginTop: '32px', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn" 
              disabled={loading}
              style={{ paddingLeft: '32px', paddingRight: '32px', fontSize: '16px' }}
            >
              {loading ? 'Enregistrement...' : 'Valider la saisie'}
            </button>
          </div>

          {message && (
            <div className={`alert ${message.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: '24px', textAlign: 'center' }}>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function DataEntryPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <DataEntryContent />
        </Suspense>
    );
}
