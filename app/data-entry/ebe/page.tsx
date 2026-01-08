'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function EbeEntryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  // Default to current month YYYY-MM
  const [month, setMonth] = useState(dateParam ? dateParam.slice(0, 7) : new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    turnover: '',
    purchases: '',
    external_charges: '',
    salaries: '',
    production_taxes: '',
  });

  const [calculated, setCalculated] = useState({
    ebe: 0,
    margin_percent: 0,
  });

  useEffect(() => {
    // Recalculate EBE and % whenever inputs change
    const turnover = parseFloat(formData.turnover) || 0;
    const purchases = parseFloat(formData.purchases) || 0;
    const external_charges = parseFloat(formData.external_charges) || 0;
    const salaries = parseFloat(formData.salaries) || 0;
    const production_taxes = parseFloat(formData.production_taxes) || 0;

    const ebe = turnover - (purchases + external_charges + salaries + production_taxes);
    const margin_percent = turnover > 0 ? (ebe / turnover) * 100 : 0;

    setCalculated({ ebe, margin_percent });
  }, [formData]);

  useEffect(() => {
    if (month) {
        fetchDataForMonth(month);
    }
  }, [month]);

  const fetchDataForMonth = async (targetMonth: string) => {
    setLoading(true);
    // targetMonth is YYYY-MM. We assume stored date is YYYY-MM-01
    const targetDate = `${targetMonth}-01`;
    
    const { data, error } = await supabase
      .from('monthly_ebe')
      .select('*')
      .eq('month', targetDate)
      .single();
    
    if (data) {
        setFormData({
            turnover: data.turnover || '',
            purchases: data.purchases || '',
            external_charges: data.external_charges || '',
            salaries: data.salaries || '',
            production_taxes: data.production_taxes || '',
        });
        setMessage({ type: 'success', text: `Données chargées pour ${targetMonth}.` });
    } else {
        // Reset form if no data found
        setFormData({
            turnover: '',
            purchases: '',
            external_charges: '',
            salaries: '',
            production_taxes: '',
        });
        setMessage(null);
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
      const dateToSave = `${month}-01`;
      const dataToSubmit = {
        month: dateToSave,
        turnover: parseFloat(formData.turnover) || 0,
        purchases: parseFloat(formData.purchases) || 0,
        external_charges: parseFloat(formData.external_charges) || 0,
        salaries: parseFloat(formData.salaries) || 0,
        production_taxes: parseFloat(formData.production_taxes) || 0,
      };

      const { data: existing } = await supabase
        .from('monthly_ebe')
        .select('id')
        .eq('month', dateToSave)
        .single();

      let error;
      if (existing) {
        const res = await supabase
          .from('monthly_ebe')
          .update(dataToSubmit)
          .eq('id', existing.id);
        error = res.error;
      } else {
        const res = await supabase
          .from('monthly_ebe')
          .insert([dataToSubmit]);
        error = res.error;
      }

      if (error) throw error;

      setMessage({ type: 'success', text: 'Données EBE enregistrées avec succès.' });
    } catch (err: any) {
      console.error(err);
      let msg = err.message;
      if (msg === 'Failed to fetch') {
        msg = "Impossible de se connecter à la base de données. Vérifiez votre connexion internet.";
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
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>Espace Saisie EBE</div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => router.push('/data-entry/ebe/history')} className="btn secondary">
                Voir l'historique
            </button>
            <Link href="/data-entry" className="btn secondary">
                Retour Saisie Journalière
            </Link>
            <a href="/api/logout" className="btn secondary">Déconnexion</a>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="title">Saisie Mensuelle EBE</h1>
        <p className="subtitle" style={{ marginBottom: '32px' }}>
          Remplissez les charges et produits pour calculer l'EBE du mois.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Date Section */}
          <div className="section" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--muted)', fontSize: '14px' }}>Mois de référence</label>
            <input 
              type="month" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid">
            {[
              { label: "Chiffre d'affaires", name: 'turnover', placeholder: '0.00' },
              { label: "Achats Consommés", name: 'purchases', placeholder: '0.00' },
              { label: "Charges Externes", name: 'external_charges', placeholder: '0.00' },
              { label: "Salaires & Charges", name: 'salaries', placeholder: '0.00' },
              { label: "Impôts & Taxes", name: 'production_taxes', placeholder: '0.00' },
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

          {/* Live Calculation Display */}
          <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text)' }}>Résultat Estimé</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '4px' }}>EBE (Excédent Brut d'Exploitation)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {calculated.ebe.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '4px' }}>Pourcentage EBE / CA</div>
                    <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold', 
                        color: (calculated.margin_percent >= 5 && calculated.margin_percent <= 15) ? '#16a34a' : 
                               (calculated.margin_percent < 5 ? '#dc2626' : '#eab308') // Red if too low, yellow if too high (or maybe good?)
                    }}>
                        {calculated.margin_percent.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#64748b' }}>
                        Cible : 5% - 15%
                    </div>
                </div>
            </div>
          </div>

          <div className="actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
                type="button"
                onClick={() => router.push('/data-entry/ebe/history')}
                className="btn secondary"
            >
                Historique complet
            </button>
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

export default function EbeEntryPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <EbeEntryContent />
        </Suspense>
    );
}
