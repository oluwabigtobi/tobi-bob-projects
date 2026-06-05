'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import ScoreBadge from '@/components/ScoreBadge'
import TrendSparkline from '@/components/TrendSparkline'
import ChatBubble from '@/components/ChatBubble'
import type { Checkin, Founder } from '@/lib/supabase'

type FullCheckin = Checkin & { founders: Founder }

const SCORE_KEYS = ['action', 'curiosity', 'adaptability', 'honesty', 'consistency'] as const

export default function FounderDetailPage({ params }: { params: Promise<{ founderId: string }> }) {
  const { founderId } = use(params)

  const [founder, setFounder] = useState<Founder | null>(null)
  const [checkins, setCheckins] = useState<FullCheckin[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [foundersRes, checkinsRes] = await Promise.all([
        fetch('/api/founders').then(r => r.json()),
        fetch(`/api/checkins?founder_id=${founderId}`).then(r => r.json()),
      ])
      const found = foundersRes.find((f: Founder) => f.id === founderId)
      setFounder(found)
      setCheckins(checkinsRes)
      if (checkinsRes.length > 0) setExpanded(checkinsRes[0].id)
      setLoading(false)
    }
    load()
  }, [founderId])

  const completed = checkins.filter(c => c.status === 'completed')

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          ← Dashboard
        </Link>
        {founder && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold text-sm">
              {founder.short_name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{founder.name}</p>
              <p className="text-xs text-gray-400">{completed.length} check-in{completed.length !== 1 ? 's' : ''} completed</p>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-16">Loading...</div>
        ) : (
          <>
            {/* Trend overview */}
            {completed.length >= 2 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Score Trends</h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {SCORE_KEYS.map(key => (
                    <div key={key}>
                      <p className="text-xs text-gray-400 capitalize mb-1">{key}</p>
                      <TrendSparkline checkins={completed} metric={key} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Context */}
            {founder?.context && (
              <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Context</p>
                <p className="text-sm text-gray-700 leading-relaxed">{founder.context}</p>
              </div>
            )}

            {/* Check-ins list */}
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Check-ins ({checkins.length})
            </h2>

            {checkins.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-12">No check-ins yet.</div>
            ) : (
              <div className="space-y-4">
                {checkins.map(checkin => (
                  <div key={checkin.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === checkin.id ? null : checkin.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">Week {checkin.week_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          checkin.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {checkin.status === 'completed' ? 'Complete' : 'In progress'}
                        </span>
                        {checkin.scores && (
                          <div className="flex gap-1">
                            {SCORE_KEYS.map(k => (
                              <ScoreBadge key={k} label={k[0].toUpperCase()} value={checkin.scores![k]} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {new Date(checkin.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-gray-400 text-sm">{expanded === checkin.id ? '↑' : '↓'}</span>
                      </div>
                    </button>

                    {expanded === checkin.id && (
                      <div className="border-t border-gray-50 px-5 py-5 space-y-5">
                        {/* Flags */}
                        {checkin.flags && checkin.flags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {checkin.flags.map(flag => (
                              <span key={flag} className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full">
                                {flag.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Summary */}
                        {checkin.summary && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { label: 'What they tried', value: checkin.summary.tried },
                              { label: 'What they learned', value: checkin.summary.learned },
                              { label: 'Belief shift', value: checkin.summary.belief_shift },
                              { label: 'What felt hard', value: checkin.summary.struggled },
                              { label: 'Next week', value: checkin.summary.commitment },
                            ].filter(item => item.value).map(item => (
                              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-gray-400 mb-1">{item.label}</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Scores */}
                        {checkin.scores && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">Scores</p>
                            <div className="flex flex-wrap gap-2">
                              {SCORE_KEYS.map(k => (
                                <ScoreBadge key={k} label={k} value={checkin.scores![k]} size="md" />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Transcript */}
                        {checkin.conversation_transcript && checkin.conversation_transcript.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-3">Full conversation</p>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                              {checkin.conversation_transcript.map((msg, i) => (
                                <ChatBubble
                                  key={i}
                                  role={msg.role}
                                  content={msg.content}
                                  founderName={founder?.short_name}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
