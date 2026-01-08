'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function EbeHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchHistory = async () => {
    try {
        const { data, error } = await supabase
        .from('monthly_ebe')
        .select('*')
        .order('month', { ascending: false });
        
        if (error) throw error;
        if (data) {
            setHistory(data);
        }
    } catch (err: any) {
        let msg = err.message;
        if (msg === 'Failed to fetch') {
            msg = "Impossible de se connecter à la base de données. Vérifiez votre connexion internet ou les identifiants Supabase.";
        }
        setMessage({ type: 'error', text: 'Erreur de chargement : ' + msg });
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('monthly_ebe')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Entrée supprimée avec succès.' });
      fetchHistory();
    } catch (err: any) {
      let msg = err.message;
      if (msg === 'Failed to fetch') {
         msg = "Impossible de se connecter à la base de données. Vérifiez votre connexion internet ou les identifiants Supabase.";
      }
      setMessage({ type: 'error', text: 'Erreur : ' + msg });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (monthDate: string) => {
    // monthDate is YYYY-MM-DD
    router.push(`/data-entry/ebe?date=${monthDate}`);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>Historique EBE</div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/data-entry/ebe" className="btn secondary">Retour à la saisie</Link>
            <a href="/api/logout" className="btn secondary">Déconnexion</a>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 className="title" style={{ margin: 0 }}>Historique EBE Mensuel</h1>
            <button 
                onClick={() => router.push('/data-entry/ebe')}
                className="btn"
            >
                Nouvelle saisie
            </button>
        </div>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '24px', textAlign: 'center' }}>
            {message.text}
          </div>
        )}
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Mois</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>CA</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Charges Totales</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>EBE</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>% Marge</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const charges = (item.purchases || 0) + (item.external_charges || 0) + (item.salaries || 0) + (item.production_taxes || 0);
                const ebe = item.ebe !== undefined ? item.ebe : (item.turnover - charges);
                const margin = item.margin_percent !== undefined ? item.margin_percent : (item.turnover ? (ebe / item.turnover) * 100 : 0);

                return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>{new Date(item.month).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{item.turnover?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{charges?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{ebe?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{margin?.toFixed(2)}%</td>
                    <td style={{ padding: '12px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                        onClick={() => handleEdit(item.month)}
                        style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                        Modifier
                        </button>
                        <button 
                        onClick={() => handleDelete(item.id)}
                        style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                        Supprimer
                        </button>
                    </td>
                    </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>Aucune donnée enregistrée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
