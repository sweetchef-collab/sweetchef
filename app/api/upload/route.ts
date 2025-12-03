import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    let rows: any[] | null = null;
    let fileName: string | undefined;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      rows = Array.isArray(body?.rows) ? body.rows : null;
      fileName = body?.file_name;
    }
    let file: File | null = null;
    if (!rows) {
      const formData = await request.formData();
      const f = formData.get('file');
      if (!f || !(f instanceof File)) {
        return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
      }
      file = f as File;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
    }

    if (!rows) rows = [];

    const mapped = rows.map((r: Record<string, any>) => {
      const lr: Record<string, any> = {};
      Object.entries(r).forEach(([k, v]) => {
        lr[(k ?? '').toString().toLowerCase().trim()] = v;
      });
      const toStr = (v: any) => {
        if (v === null || v === undefined) return null;
        const s = typeof v === 'string' ? v.trim() : String(v);
        return s.length ? s : null;
      };
      const toNum = (v: any) => {
        if (v === null || v === undefined) return null;
        if (typeof v === 'number' && isFinite(v)) return v;
        let s = String(v).trim().replace(/\s+/g, '');
        const hasComma = s.includes(',');
        const hasDot = s.includes('.');
        if (hasComma && hasDot) s = s.replace(/\./g, '').replace(',', '.');
        else if (hasComma && !hasDot) s = s.replace(',', '.');
        const n = parseFloat(s);
        return isFinite(n) ? n : null;
      };
      const toDate = (v: any) => {
        if (v === null || v === undefined) return null;
        if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
        if (typeof v === 'number' && isFinite(v)) {
          const ms = Math.round((v - 25569) * 86400000);
          const d = new Date(ms);
          return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
        }
        const s = String(v).trim();
        const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (m) {
          const dd = parseInt(m[1], 10);
          const mm = parseInt(m[2], 10) - 1;
          const yyyy = parseInt(m[3], 10);
          const d = new Date(Date.UTC(yyyy, mm, dd));
          return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      };
      return {
        date: toDate(lr['date']),
        code_postal: toStr(lr['code postal']),
        ville: toStr(lr['ville']),
        code_client: toStr(lr['code client']),
        nom_du_client: toStr(lr['nom du client']),
        quantite: toNum(lr['quantite']),
        total_ventes: toNum(lr['total ventes']),
        marge_brute: toNum(lr['marge brute']),
        famille_des_clients: toStr(lr['famille des clients']),
        vendeur_nom: toStr(lr['vendeur nom']),
      };
    }).filter((o) => Object.values(o).some((v) => v !== null));

    if (mapped.length) {
      const size = 1000;
      for (let i = 0; i < mapped.length; i += size) {
        const chunk = mapped.slice(i, i + size);
        const { error } = await supabase.from('sales').insert(chunk);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    const { error: archiveError } = await supabase
      .from('imports')
      .insert({ file_name: fileName ?? (file?.name || 'upload'), rows });

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    return NextResponse.json({ message: `Importé ${mapped.length} lignes ciblées et archivé ${rows.length} lignes depuis ${file.name}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur interne' }, { status: 500 });
  }
}
