'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Founder } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [founders, setFounders] = useState<Founder[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/founders')
      .then(r => r.json())
      .then(setFounders)
      .finally(() => setLoading(false))
  }, [])

  async function startCheckin(founder: Founder) {
    setStarting(founder.id)

    const res = await fetch(`/api/checkins?founder_id=${founder.id}`)
    const checkins = await res.json()
    const completed = checkins.filter((c: { status: string }) => c.status === 'completed')
    const weekNumber = completed.length + 1

    const checkinRes = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ founder_id: founder.id, week_number: weekNumber }),
    })
    const checkin = await checkinRes.json()

    router.push(`/chat/${checkin.id}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 text-white text-2xl font-bold mb-4">
            L
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Levity Check-In</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Weekly check-in for Cohort 3. Takes about 5–10 minutes.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600 text-center mb-4">Who are you?</p>
            {founders.map(founder => (
              <button
                key={founder.id}
                onClick={() => startCheckin(founder)}
                disabled={starting !== null}
                className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 text-left hover:border-emerald-400 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                  {founder.short_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{founder.short_name}</p>
                  {founder.context && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{founder.context.split('.')[0]}</p>
                  )}
                </div>
                {starting === founder.id ? (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <span className="text-gray-300 group-hover:text-emerald-400 transition-colors text-lg">→</span>
                )}
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-10">
          Levity · Cohort 3 · 2025
        </p>
      </div>
    </main>
  )
}
