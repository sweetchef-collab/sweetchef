'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [ok, setOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [drag, setDrag] = useState<boolean>(false);
  const [verify, setVerify] = useState<any | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setOk(null);
      setStatus('Veuillez sélectionner un fichier CSV/XLS/XLSX.');
      return;
    }
    setLoading(true);
    setOk(null);
    setStatus('Envoi en cours…');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/import-csv', { method: 'POST', body: fd });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : { error: await res.text() };
      if (!res.ok) {
        setOk(false);
        setStatus(`Erreur: ${data.error || 'inconnue'}`);
      } else {
        setOk(true);
        setStatus(data.success ? `Importé ${data.imported} lignes depuis ${data.file}` : `${data.message || 'Import terminé'}`);
      }
    } catch (err: any) {
      setOk(false);
      setStatus(`Erreur réseau: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!file) {
      setOk(null);
      setStatus('Veuillez sélectionner un fichier.');
      return;
    }
    setLoading(true);
    setVerify(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/import-csv?dryRun=1', { method: 'POST', body: fd });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : { error: await res.text() };
      if (!res.ok) {
        setOk(false);
        setStatus(`Erreur: ${data.error || 'inconnue'}`);
      } else {
        setOk(true);
        setStatus('Validation terminée');
        setVerify({ file: data.file, total_rows: data.validated, valid_dates: data.validated, invalid_dates: 0, invalid_date_samples: [] });
      }
    } catch (err: any) {
      setOk(false);
      setStatus(`Erreur réseau: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Import Ventes sans vendeur</h1>
        <p className="subtitle">Colonnes attendues: Code Client, Client, Objet, N° Facture, Date Facture, Total HT, Total TTC.</p>
        <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="section">
            <div
              className={"dropzone" + (drag ? " drag" : "")}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              {file ? (
                <>
                  <div>Fichier prêt</div>
                  <div className="file-info">{file.name}</div>
                </>
              ) : (
                <>
                  <div>Glissez-déposez votre fichier ici</div>
                  <div className="file-info">ou cliquez ci-dessous</div>
                </>
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="actions">
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button className="btn" type="submit" disabled={loading}> {loading ? 'Import…' : 'Importer'} </button>
                <button className="btn secondary" type="button" onClick={handleVerify} disabled={loading || !file}>Vérifier</button>
                {file && <button className="btn secondary" type="button" onClick={() => { setFile(null); setStatus(''); setOk(null); }}>Réinitialiser</button>}
              </div>
            </form>
            {loading && <div className="progress"><div className="progress-bar" /></div>}
            {status && (
              <div className="status">
                <div className={"alert " + (ok ? 'success' : ok === false ? 'error' : '')}>{status}</div>
              </div>
            )}
            {verify && (
              <div className="section" style={{ marginTop: 12 }}>
                <div className="subtitle">Résultat de vérification</div>
                <table className="table">
                  <tbody>
                    <tr><td>Fichier</td><td style={{ textAlign:'right' }}>{verify.file}</td></tr>
                    <tr><td>Lignes totales</td><td style={{ textAlign:'right' }}>{verify.total_rows}</td></tr>
                    <tr><td>Dates valides</td><td style={{ textAlign:'right' }}>{verify.valid_dates}</td></tr>
                    <tr><td>Dates invalides</td><td style={{ textAlign:'right' }}>{verify.invalid_dates}</td></tr>
                  </tbody>
                </table>
                {Array.isArray(verify.invalid_date_samples) && verify.invalid_date_samples.length > 0 && (
                  <table className="table" style={{ marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Original</th>
                        <th style={{ textAlign:'right' }}>Parse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verify.invalid_date_samples.map((s:any, i:number) => (
                        <tr key={i}><td>{String(s.original ?? '')}</td><td style={{ textAlign:'right' }}>{String(s.parsed ?? '')}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
