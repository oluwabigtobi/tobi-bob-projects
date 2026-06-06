import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { buildScoringPrompt } from '@/lib/prompts'
import type { Founder, Message } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const { checkinId } = await request.json()

  if (!checkinId) {
    return NextResponse.json({ error: 'checkinId required' }, { status: 400 })
  }

  const { data, error } = await supabase()
    .from('checkins')
    .select('*, founders(*)')
    .eq('id', checkinId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Checkin not found' }, { status: 404 })
  }

  const checkin = data as typeof data & { founders: Founder }
  const transcript: Message[] = (checkin.conversation_transcript || []) as Message[]

  if (transcript.length < 4) {
    return NextResponse.json({ error: 'Conversation too short to score' }, { status: 400 })
  }

  const prompt = buildScoringPrompt(checkin.founders as Founder, transcript)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text)

    await supabase()
      .from('checkins')
      .update({
        summary: parsed.summary,
        scores: parsed.scores,
        flags: parsed.flags || [],
        commitment: parsed.commitment,
        status: 'completed',
      })
      .eq('id', checkinId)

    return NextResponse.json({ success: true, data: parsed })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
