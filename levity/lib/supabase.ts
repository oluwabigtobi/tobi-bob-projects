// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any>

export type Founder = {
  id: string
  name: string
  short_name: string
  context: string | null
  created_at: string
}

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type CheckinSummary = {
  tried: string
  learned: string
  belief_shift: string | null
  struggled: string
  commitment: string
}

export type CheckinScores = {
  action: number
  curiosity: number
  adaptability: number
  honesty: number
  consistency: number
}

export type Checkin = {
  id: string
  founder_id: string
  week_number: number
  conversation_transcript: Message[]
  summary: CheckinSummary | null
  scores: CheckinScores | null
  flags: string[]
  commitment: string | null
  status: 'in_progress' | 'completed'
  created_at: string
}

let _supabase: AnySupabase | null = null

export function supabase(): AnySupabase {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
    _supabase = createClient(url, key)
  }
  return _supabase
}
