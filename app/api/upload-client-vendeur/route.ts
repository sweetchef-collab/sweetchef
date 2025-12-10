import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ck = cookies();
    const role = ck.get('sc_role')?.value;
    if (role !== 'admin' && ck.get('sc_admin')?.value !== '1') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });

    const norm = (v: any) => String(v ?? '').trim().toLowerCase();
    const toStr = (v: any) => {
      if (v === null || v === undefined) return null;
      const s = typeof v === 'string' ? v.trim() : String(v);
      return s.length ? s : null;
    };

    const items = [] as any[];
    for (const r of rows as any[]) {
      const code = toStr(r['Code'] ?? r['code'] ?? r['CODE'] ?? r['Code Client'] ?? r['code client']);
      const societe = toStr(r['Société'] ?? r['Societe'] ?? r['societe'] ?? r['SOCIETE'] ?? r['Société']);
      const nom = toStr(r['Nom'] ?? r['nom'] ?? r['NOM']);
      const prenom = toStr(r['Prénom'] ?? r['Prenom'] ?? r['prenom'] ?? r['PRENOM']);
      const groupe = toStr(r['Groupe'] ?? r['groupe'] ?? r['GROUPE']);
      const code_postal = toStr(r['Code Postal'] ?? r['code postal'] ?? r['CODE POSTAL']);
      const ville = toStr(r['Ville'] ?? r['ville'] ?? r['VILLE']);
      const vendeur = toStr(r['Vendeur'] ?? r['vendeur'] ?? r['VENDEUR']);

      if (!code && !societe && !nom && !prenom && !groupe && !code_postal && !ville && !vendeur) continue;
      items.push({ code_client: code, societe, nom, prenom, groupe, code_postal, ville, vendeur });
    }

    if (!items.length) {
      return NextResponse.json({ error: 'Aucune ligne détectée' }, { status: 400 });
    }

    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const { error } = await supabase.from('client_vendeur').insert(chunk);
      if (error) {
        return NextResponse.json({ error: error.message, inserted }, { status: 500 });
      }
      inserted += chunk.length;
    }

    return NextResponse.json({ message: `Import terminé: ${inserted} lignes` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur interne' }, { status: 500 });
  }
}
