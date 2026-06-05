'use client'

type Props = {
  role: 'user' | 'assistant'
  content: string
  founderName?: string
}

export default function ChatBubble({ role, content, founderName }: Props) {
  const isAgent = role === 'assistant'

  return (
    <div className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
          isAgent ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'
        }`}
      >
        {isAgent ? 'L' : (founderName?.[0] || 'F')}
      </div>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAgent
            ? 'bg-white text-gray-800 shadow-sm border border-gray-100'
            : 'bg-emerald-600 text-white'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
