import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const founderId = searchParams.get('founder_id')

  if (founderId) {
    const { data, error } = await supabase()
      .from('checkins')
      .select('*')
      .eq('founder_id', founderId)
      .order('week_number', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase()
    .from('checkins')
    .select('*, founders(name, short_name, context)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { founder_id, week_number } = body

  if (!founder_id || !week_number) {
    return NextResponse.json({ error: 'founder_id and week_number required' }, { status: 400 })
  }

  const { data: existing } = await supabase()
    .from('checkins')
    .select('id')
    .eq('founder_id', founder_id)
    .eq('week_number', week_number)
    .eq('status', 'in_progress')
    .single()

  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase()
    .from('checkins')
    .insert({ founder_id, week_number, status: 'in_progress' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data, error } = await supabase()
    .from('checkins')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
