import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { supabase as publicClient } from '@/lib/supabaseClient'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

const InvoiceSchema = z.object({
  code_client: z.string().optional(),
  client: z.string().min(1),
  objet: z.string().optional(),
  facture: z.string().optional(),
  date_facture: z.string().nullable(),
  total_ht: z.number().nullable(),
  total_ttc: z.number().nullable(),
})

function cleanNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const s = String(value).replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(s)
  return isFinite(n) ? n : null
}

function cleanDate(value: any): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function cleanRow(row: any) {
  const norm = (s: any) => (s ?? '').toString().toLowerCase().trim()
  const lr: Record<string, any> = {}
  Object.entries(row).forEach(([k, v]) => { lr[norm(k)] = v })
  return {
    code_client: (() => { const v = (lr['code client'] ?? '').toString().trim(); return v ? v : undefined })(),
    client: (lr['client'] ?? '').toString().trim(),
    objet: (() => { const v = (lr['objet'] ?? '').toString().trim(); return v ? v : undefined })(),
    facture: (() => { const v = (lr['n° facture'] ?? lr['facture'] ?? '').toString().trim(); return v ? v : undefined })(),
    date_facture: cleanDate(lr['date facture']),
    total_ht: cleanNumber(lr['total ht']),
    total_ttc: cleanNumber(lr['total ttc']),
  }
}

export async function POST(request: Request) {
  try {
    const ck = cookies();
    const role = ck.get('sc_role')?.value;
    if (role !== 'admin' && ck.get('sc_admin')?.value !== '1') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const u = new URL(request.url)
    const dryRun = u.searchParams.get('dryRun') === '1' || u.searchParams.get('dry') === '1'
    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier envoyé' }, { status: 400 })
    }
    const hasService = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasPublic = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!hasService && !hasPublic) {
      return NextResponse.json({ error: 'Variables Supabase manquantes' }, { status: 500 })
    }
    const sb = hasService
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : publicClient
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { raw: false })
    const cleaned = rows.map(cleanRow)
    for (const r of cleaned) InvoiceSchema.parse(r)
    if (dryRun) {
      return NextResponse.json({ success: true, validated: cleaned.length, file: file.name })
    }
    const { error } = await sb.from('factures').insert(cleaned)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, imported: cleaned.length, file: file.name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur' }, { status: 500 })
  }
}
