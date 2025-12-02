'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setOk(null);
      setStatus('Veuillez sélectionner un fichier CSV/XLS/XLSX.');
      return;
    }
    setLoading(true);
    setOk(null);
    setStatus('Import en cours…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload-client-vendeur', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setOk(false);
        setStatus(`Erreur: ${data.error || 'inconnue'}`);
      } else {
        setOk(true);
        setStatus(`${data.message}`);
      }
    } catch (err: any) {
      setOk(false);
      setStatus(`Erreur réseau: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Import Client–Vendeur</h1>
        <p className="subtitle">Colonnes: Code, Société, Nom, Prénom, Groupe, Code Postal, Ville, Vendeur.</p>
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
          <div className="section">
            <form onSubmit={handleSubmit}>
              <div className="dropzone">
                <input
                  type="file"
                  accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && <div className="file-info">{file.name}</div>}
              </div>
              <div className="actions">
                <button className="btn" type="submit" disabled={loading}>{loading ? 'Import…' : 'Importer'}</button>
                {file && <button className="btn secondary" type="button" onClick={() => { setFile(null); setStatus(''); setOk(null); }}>Réinitialiser</button>}
              </div>
            </form>
            {loading && <div className="progress"><div className="progress-bar" /></div>}
            {status && (
              <div className="status">
                <div className={"alert " + (ok ? 'success' : ok === false ? 'error' : '')}>{status}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

