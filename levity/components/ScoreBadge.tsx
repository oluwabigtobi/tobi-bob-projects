'use client'

type Props = {
  label: string
  value: number | null | undefined
  size?: 'sm' | 'md'
}

const colors = ['', 'bg-red-100 text-red-700', 'bg-yellow-100 text-yellow-700', 'bg-green-100 text-green-700']
const colorsBig = ['', 'text-red-500', 'text-yellow-500', 'text-green-500']

export default function ScoreBadge({ label, value, size = 'sm' }: Props) {
  if (value == null) return null

  if (size === 'md') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className={`text-2xl font-bold ${colorsBig[value] || 'text-gray-400'}`}>{value}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-600'}`}>
      {label} {value}/3
    </span>
  )
}
