import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    let rows: any[] = [];
    let fileName: string | undefined;
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await request.json();
      rows = Array.isArray(body?.rows) ? body.rows : [];
      fileName = body?.file_name;
    }
    let file: File | null = null;
    if (!rows.length) {
      const formData = await request.formData();
      const f = formData.get('file');
      if (!f || !(f instanceof File)) {
        return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
      }
      file = f as File;
      const arrayBuffer = await file.arrayBuffer();
      const name = (file?.name || '').toLowerCase();
      if (name.endsWith('.csv')) {
        const text = new TextDecoder('utf-8').decode(arrayBuffer);
        const sample = text.slice(0, 1024);
        const hasSemi = sample.includes(';');
        const opts: any = { columns: (h: any) => (h ?? '').toString().toLowerCase().trim(), skip_empty_lines: true, bom: true, delimiter: hasSemi ? ';' : ',' };
        try {
          rows = parseCsv(text, opts);
        } catch {
          rows = parseCsv(text, { ...opts, delimiter: hasSemi ? ',' : ';' });
        }
      } else {
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
      }
    }

    const norm = (s: any) => (s ?? '').toString().toLowerCase().trim();
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
    const toBool = (v: any) => {
      if (v === null || v === undefined) return null;
      const s = norm(v);
      return ['1', 'true', 'vrai', 'oui', 'y', 'yes'].includes(s) ? true : ['0', 'false', 'faux', 'non', 'n'].includes(s) ? false : null;
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

    const mapped = (rows || []).map((r: Record<string, any>) => {
      const lr: Record<string, any> = {};
      Object.entries(r).forEach(([k, v]) => { lr[norm(k)] = v; });
      return {
        code_client: toStr(lr['code client']),
        client: toStr(lr['client']),
        objet: toStr(lr['objet']),
        num_facture: toStr(lr['n° facture']),
        num_document_client: toStr(lr['n° document client']),
        date_facture: toDate(lr['date facture']),
        total_ht: toNum(lr['total ht']),
        total_ttc: toNum(lr['total ttc']),
        valide: toBool(lr['validé']),
        imp: toBool(lr['imp']),
        mail: toBool(lr['mail']),
        etat: toStr(lr['etat']),
      };
    }).filter((o) => Object.values(o).some((v) => v !== null));

    let inserted = 0;
    if (mapped.length) {
      const size = 1000;
      for (let i = 0; i < mapped.length; i += size) {
        const chunk = mapped.slice(i, i + size);
        const { error } = await supabase.from('sales_clean').insert(chunk);
        if (error) {
          const msg = String(error.message || '').toLowerCase();
          const tableMissing = error.code === '42P01' || msg.includes('relation') && msg.includes('does not exist');
          if (tableMissing) {
            inserted = 0;
            break;
          }
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        inserted += chunk.length;
      }
    }

    const { error: archiveError } = await supabase
      .from('imports')
      .insert({ file_name: fileName ?? (file?.name || 'upload'), rows });
    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    const msg = inserted
      ? `Importé ${inserted} lignes (ventes sans vendeur) et archivé ${rows.length} lignes depuis ${file?.name || fileName || 'upload'}`
      : `Table sales_clean absente: archivage ${rows.length} lignes depuis ${file?.name || fileName || 'upload'}`;
    return NextResponse.json({ message: msg });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur interne' }, { status: 500 });
  }
}
