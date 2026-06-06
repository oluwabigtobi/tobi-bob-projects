import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from('founders')
      .select('*')
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: String(err), env_check: { url: !!process.env.NEXT_PUBLIC_SUPABASE_URL, key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY } },
      { status: 500 }
    )
  }
}
