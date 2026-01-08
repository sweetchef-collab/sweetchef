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
    margin: '',
    receivables: '',
    payables: '',
    cash: '',
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
            margin: data.margin || '',
            receivables: data.receivables || '',
            payables: data.payables || '',
            cash: data.cash || '',
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
      const dataToSubmit = {
        date,
        revenue: parseFloat(formData.revenue) || 0,
        margin: parseFloat(formData.margin) || 0,
        receivables: parseFloat(formData.receivables) || 0,
        payables: parseFloat(formData.payables) || 0,
        cash: parseFloat(formData.cash) || 0,
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
            <button onClick={() => router.push('/data-entry/ebe')} className="btn secondary">
                Saisie EBE (Mensuel)
            </button>
            <button onClick={() => router.push('/data-entry/history')} className="btn secondary">
                Voir l'historique
            </button>
            <a href="/api/logout" className="btn secondary">Déconnexion</a>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="title">Saisie Journalière</h1>
        <p className="subtitle" style={{ marginBottom: '32px' }}>
          Remplissez les indicateurs financiers pour la date sélectionnée.
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
              { label: "Chiffre d'affaires", name: 'revenue', placeholder: '0.00' },
              { label: "Marge", name: 'margin', placeholder: '0.00' },
              { label: "Balance clients (Créances)", name: 'receivables', placeholder: '0.00' },
              { label: "Balance fournisseurs (Dettes)", name: 'payables', placeholder: '0.00' },
              { label: "Trésorerie disponible", name: 'cash', placeholder: '0.00' },
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
