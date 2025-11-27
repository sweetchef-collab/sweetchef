'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
      </div>
      <div className="panel">
        <h1 className="title">Import Produit</h1>
        <p className="subtitle">Module à venir. Préparez votre fichier CSV/XLS(X) avec les colonnes produits.
        </p>
        <div className="actions">
          <a className="btn secondary" href="/">Retour</a>
        </div>
      </div>
    </div>
  );
}
