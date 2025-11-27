import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
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

    const norm = (s: any) => (s ?? '').toString().toLowerCase().trim();
    const toStr = (v: any) => {
      if (v === null || v === undefined) return null;
      const s = typeof v === 'string' ? v.trim() : String(v);
      return s.length ? s : null;
    };
    const toNum = (v: any) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'number' && isFinite(v)) return v;
      const s = String(v).replace(/\s+/g, '').replace(',', '.');
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

    let total = 0;
    let validDates = 0;
    let invalidDates = 0;
    const samples: { original: any; parsed: string | null }[] = [];

    for (const r of rows as any[]) {
      total += 1;
      const v = r['Date Facture'] ?? r['date facture'] ?? r['DATE FACTURE'];
      const parsed = toDate(v);
      if (parsed) validDates += 1; else {
        invalidDates += 1;
        if (samples.length < 20) samples.push({ original: v, parsed });
      }
    }

    return NextResponse.json({
      file: file.name,
      total_rows: total,
      valid_dates: validDates,
      invalid_dates: invalidDates,
      invalid_date_samples: samples,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erreur interne' }, { status: 500 });
  }
}

