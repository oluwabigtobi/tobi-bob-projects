'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import ChatBubble from '@/components/ChatBubble'
import type { Checkin, Founder } from '@/lib/supabase'

type FullCheckin = Checkin & { founders: Founder }

export default function ChatPage({ params }: { params: Promise<{ checkinId: string }> }) {
  const { checkinId } = use(params)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const initCalledRef = useRef(false)

  const [checkin, setCheckin] = useState<FullCheckin | null>(null)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [done, setDone] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [scoring, setScoring] = useState(false)

  useEffect(() => {
    if (initCalledRef.current) return
    initCalledRef.current = true

    const load = async () => {
      const res = await fetch(`/api/checkins/${checkinId}`)
      if (!res.ok) { router.push('/'); return }
      const found: FullCheckin = await res.json()

      setCheckin(found)
      const existing = found.conversation_transcript || []
      setMessages(existing)

      if (found.status === 'completed') {
        setDone(true)
        setInitialized(true)
      } else if (existing.length === 0) {
        setInitialized(true)
        // Kick off agent opening message
        await runStream(found, [])
      } else {
        setInitialized(true)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkinId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  async function runStream(
    activeCheckin: FullCheckin,
    currentMessages: { role: 'user' | 'assistant'; content: string }[],
    userMessage?: string
  ) {
    setStreaming(true)
    setStreamBuffer('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkinId: activeCheckin.id, message: userMessage }),
    })

    if (!res.body) { setStreaming(false); return }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let fullText = ''

    while (true) {
      const { done: streamDone, value } = await reader.read()
      if (streamDone) break

      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const payload = JSON.parse(line.slice(6))
          if (payload.text) {
            fullText += payload.text
            setStreamBuffer(fullText)
          }
          if (payload.done) {
            const cleanText = fullText.replace('[CONVERSATION_COMPLETE]', '').trim()
            setMessages(prev => [...prev, { role: 'assistant', content: cleanText }])
            setStreamBuffer('')
            setStreaming(false)

            if (payload.isComplete) {
              setDone(true)
              setScoring(true)
              await fetch('/api/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkinId: activeCheckin.id }),
              })
              setScoring(false)
            }
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  }

  async function sendMessage(userMessage: string) {
    if (!checkin || streaming || !userMessage.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    await runStream(checkin, messages, userMessage)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) sendMessage(input.trim())
    }
  }

  const founder = checkin?.founders

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          ←
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
            L
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">Levity</p>
            {founder && (
              <p className="text-xs text-gray-400 mt-0.5">
                Week {checkin?.week_number} · {founder.short_name}
              </p>
            )}
          </div>
        </div>
        {done && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
            {scoring ? 'Saving…' : 'Complete'}
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-4">
        {!initialized && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">L</div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} founderName={founder?.short_name} />
        ))}

        {streamBuffer && (
          <ChatBubble role="assistant" content={streamBuffer} founderName={founder?.short_name} />
        )}

        {streaming && !streamBuffer && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">L</div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 bg-white px-4 py-4 sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          {done ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">Check-in complete. See you next week.</p>
              <button onClick={() => router.push('/')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Back to home
              </button>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={streaming || !initialized}
                placeholder="Type your reply… (Enter to send)"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 disabled:opacity-50 disabled:bg-gray-50 transition-colors"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={e => {
                  const t = e.currentTarget
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage(input.trim())}
                disabled={!input.trim() || streaming || !initialized}
                className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
