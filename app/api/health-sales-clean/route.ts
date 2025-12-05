import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('sales_clean')
      .select('code_client,client,date_facture,total_ht')
      .range(0, 9)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    const rows = Array.isArray(data) ? data.length : 0
    return NextResponse.json({ ok: true, rows, sample: data || [] })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Erreur' }, { status: 500 })
  }
}
