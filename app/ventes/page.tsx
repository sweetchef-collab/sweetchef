'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Papa from 'papaparse';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [ok, setOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [drag, setDrag] = useState<boolean>(false);

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
      const isCsv = /\.csv$/i.test(file.name);
      let res: Response;
      if (isCsv) {
        const parsed = await new Promise<any[]>((resolve, reject) => {
          Papa.parse(file!, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => (h ?? '').toString().toLowerCase().trim(),
            complete: (r) => resolve(r.data as any[]),
            error: reject,
          });
        });
        res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_name: file.name, rows: parsed }),
        });
      } else {
        const fd = new FormData();
        fd.append('file', file);
        res = await fetch('/api/upload', { method: 'POST', body: fd });
      }
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
        <h1 className="title">Import Ventes CSV / Excel</h1>
        <p className="subtitle">Importez les colonnes ventes vers la table <code>sales</code>.</p>
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
