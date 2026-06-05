'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ScoreBadge from '@/components/ScoreBadge'
import type { Checkin, Founder } from '@/lib/supabase'

type FounderWithCheckins = Founder & { checkins: Checkin[] }

function cohortStatus(checkins: Checkin[]): 'green' | 'yellow' | 'red' | 'gray' {
  const completed = checkins.filter(c => c.status === 'completed' && c.scores)
  if (completed.length === 0) return 'gray'

  const latest = completed.sort((a, b) => b.week_number - a.week_number)[0]
  const scores = latest.scores!
  const avg = (scores.action + scores.curiosity + scores.adaptability + scores.honesty + scores.consistency) / 5

  if (avg >= 2.5) return 'green'
  if (avg >= 1.8) return 'yellow'
  return 'red'
}

const statusColors = {
  green: 'bg-green-100 text-green-700 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  gray: 'bg-gray-100 text-gray-500 border-gray-200',
}

const statusLabels = {
  green: 'Strong',
  yellow: 'Watch',
  red: 'Concern',
  gray: 'No data',
}

export default function DashboardPage() {
  const router = useRouter()
  const [founders, setFounders] = useState<FounderWithCheckins[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [foundersRes, checkinsRes] = await Promise.all([
        fetch('/api/founders').then(r => r.json()),
        fetch('/api/checkins').then(r => r.json()),
      ])

      const withCheckins = foundersRes.map((f: Founder) => ({
        ...f,
        checkins: checkinsRes.filter((c: Checkin) => c.founder_id === f.id),
      }))

      setFounders(withCheckins)
      setLoading(false)
    }
    load()
  }, [])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/dashboard/login')
    router.refresh()
  }

  const totalCheckins = founders.reduce((sum, f) => sum + f.checkins.filter(c => c.status === 'completed').length, 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">L</div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Levity Dashboard</h1>
            <p className="text-xs text-gray-400">Cohort 3 · Phase 1</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Founder view ↗
          </a>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Founders', value: founders.length },
            { label: 'Total check-ins', value: totalCheckins },
            { label: 'This week', value: founders.filter(f => {
              const latest = f.checkins.filter(c => c.status === 'completed').sort((a, b) => b.week_number - a.week_number)[0]
              if (!latest) return false
              const d = new Date(latest.created_at)
              return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
            }).length },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Founder grid */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Founders</h2>

        {loading ? (
          <div className="text-sm text-gray-400 text-center py-16">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {founders.map(founder => {
              const status = cohortStatus(founder.checkins)
              const completed = founder.checkins.filter(c => c.status === 'completed')
              const latest = completed.sort((a, b) => b.week_number - a.week_number)[0]
              const flags = latest?.flags || []

              return (
                <Link
                  key={founder.id}
                  href={`/dashboard/founder/${founder.id}`}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:border-emerald-300 hover:shadow-sm transition-all block"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                        {founder.short_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{founder.short_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{completed.length} check-in{completed.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[status]}`}>
                      {statusLabels[status]}
                    </span>
                  </div>

                  {founder.context && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">{founder.context}</p>
                  )}

                  {latest?.scores && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Object.entries(latest.scores).map(([key, val]) => (
                        <ScoreBadge key={key} label={key} value={val as number} />
                      ))}
                    </div>
                  )}

                  {flags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {flags.map((flag: string) => (
                        <span key={flag} className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
                          {flag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {latest?.commitment && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-xs text-gray-400">Next: <span className="text-gray-600">{latest.commitment}</span></p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
