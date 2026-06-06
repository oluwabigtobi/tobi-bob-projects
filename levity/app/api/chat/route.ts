import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { buildSystemPrompt } from '@/lib/prompts'
import type { Message, Checkin, Founder } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type CheckinWithFounder = Checkin & { founders: Founder }

export async function POST(request: NextRequest) {
  const { checkinId, message } = await request.json()

  if (!checkinId) {
    return new Response('checkinId required', { status: 400 })
  }

  const { data, error: checkinErr } = await supabase()
    .from('checkins')
    .select('*, founders(*)')
    .eq('id', checkinId)
    .single()

  if (checkinErr || !data) {
    return new Response('Checkin not found', { status: 404 })
  }

  const checkin = data as CheckinWithFounder
  const founder = checkin.founders
  const transcript: Message[] = checkin.conversation_transcript || []

  let lastCheckin: Checkin | null = null
  if (checkin.week_number > 1) {
    const { data: last } = await supabase()
      .from('checkins')
      .select('*')
      .eq('founder_id', checkin.founder_id)
      .eq('status', 'completed')
      .order('week_number', { ascending: false })
      .limit(1)
      .single()
    lastCheckin = last as Checkin | null
  }

  const updatedTranscript: Message[] = message
    ? [...transcript, { role: 'user' as const, content: message }]
    : transcript

  const apiMessages = updatedTranscript.length > 0
    ? updatedTranscript.map(m => ({ role: m.role, content: m.content }))
    : [{ role: 'user' as const, content: '[Start the check-in conversation]' }]

  await supabase()
    .from('checkins')
    .update({ conversation_transcript: updatedTranscript })
    .eq('id', checkinId)

  const systemPrompt = buildSystemPrompt(founder, checkin.week_number, lastCheckin)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''

      try {
        const claudeStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: apiMessages,
        })

        for await (const chunk of claudeStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullResponse += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        const isComplete = fullResponse.includes('[CONVERSATION_COMPLETE]')
        const cleanResponse = fullResponse.replace('[CONVERSATION_COMPLETE]', '').trim()

        const finalTranscript: Message[] = [
          ...updatedTranscript,
          { role: 'assistant' as const, content: cleanResponse },
        ]

        const updates: Record<string, unknown> = { conversation_transcript: finalTranscript }
        if (isComplete) updates.status = 'completed'

        await supabase().from('checkins').update(updates).eq('id', checkinId)

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, isComplete })}\n\n`)
        )
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
