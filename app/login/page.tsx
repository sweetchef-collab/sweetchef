'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Page() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const n = url.searchParams.get('next');
      if (n) setNextPath(n);
    } catch {}
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOk(null);
    setStatus('Connexion…');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOk(false);
        setStatus(`Erreur: ${data.error || 'inconnue'}`);
      } else {
        setOk(true);
        setStatus('Connecté');
        const to = data?.role === 'icham' ? '/icham' : (nextPath || '/');
        window.location.href = to;
      }
    } catch (err: any) {
      setOk(false);
      setStatus(`Erreur réseau: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-logo">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={80} height={80} />
        </div>
        <div className="auth-title">Sweet Chef Dashboard</div>
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
            <input type="text" placeholder="Utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="auth-actions">
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
            </div>
          </div>
        </form>
        {status && (
          <div className="status" style={{ marginTop: 12 }}>
            <div className={"alert " + (ok ? 'success' : ok === false ? 'error' : '')}>{status}</div>
          </div>
        )}
      </div>
    </div>
  );
}
