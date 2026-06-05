'use client'

import type { Checkin } from '@/lib/supabase'

type Props = {
  checkins: Checkin[]
  metric: keyof NonNullable<Checkin['scores']>
}

export default function TrendSparkline({ checkins, metric }: Props) {
  const sorted = [...checkins]
    .filter(c => c.scores && c.scores[metric] != null)
    .sort((a, b) => a.week_number - b.week_number)
    .slice(-6)

  if (sorted.length < 2) {
    return <span className="text-xs text-gray-400">not enough data</span>
  }

  const values = sorted.map(c => c.scores![metric])
  const w = 80
  const h = 32
  const padding = 4

  const minV = 1
  const maxV = 3

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (w - padding * 2)
    const y = h - padding - ((v - minV) / (maxV - minV)) * (h - padding * 2)
    return `${x},${y}`
  })

  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  const trend = last > prev ? 'up' : last < prev ? 'down' : 'flat'
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94a3b8'

  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} className="overflow-visible">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={trendColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => {
          const [x, y] = p.split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r="2.5" fill={trendColor} />
        })}
      </svg>
      <span className={`text-xs font-medium`} style={{ color: trendColor }}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {last}/3
      </span>
    </div>
  )
}
