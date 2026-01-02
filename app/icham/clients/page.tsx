import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import IchamClientsList from '../../_components/IchamClientsList';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const toStr = (v: any) => {
  if (v === null || v === undefined) return null;
  const s = typeof v === 'string' ? v.trim() : String(v);
  return s.length ? s : null;
};

export default async function Page() {
  const ck = cookies();
  const isIcham = ck.get('sc_role')?.value === 'icham';
  const isAdmin = ck.get('sc_admin')?.value === '1' || ck.get('sc_role')?.value === 'admin';
  if (!isIcham && !isAdmin) {
    return (<div className="container"><div className="panel"><div className="alert">Non autorisé</div></div></div>);
  }

  const { data, error } = await supabase
    .from('client_vendeur')
    .select('code_client,societe,nom,prenom,groupe,code_postal,ville,vendeur')
    .order('societe', { ascending: true })
    .range(0, 99999);
  if (error) {
    return (
      <div className="container"><div className="panel"><div className="alert">{error.message}</div></div></div>
    );
  }
  const rows = (data || []).filter((r: any) => String(r.vendeur ?? '').trim().toUpperCase() === 'ICHAM')
    .map((r: any) => ({
      code_client: toStr(r.code_client),
      societe: toStr(r.societe),
      nom: toStr(r.nom),
      prenom: toStr(r.prenom),
      groupe: toStr(r.groupe),
      code_postal: toStr(r.code_postal),
      ville: toStr(r.ville),
    }));

  return (
    <div className="container">
      <div className="header">
        <Link href="/" className="brand" aria-label="Sweet Chef Dashboard">
          <Image className="brand-logo" src="/images/Logo.png" alt="Sweet Chef" width={64} height={64} />
        </Link>
        <div style={{ display:'flex', gap: 8 }}>
          <a className="btn secondary" href="/api/logout">Déconnexion</a>
        </div>
      </div>
      <div className="panel">
        <h1 className="title">Tous les clients — Icham</h1>
        <p className="subtitle">Source: `client_vendeur` (liste complète, y compris les clients inactifs ce mois).</p>
        <IchamClientsList rows={rows} />
      </div>
    </div>
  );
}
