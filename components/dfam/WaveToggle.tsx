'use client'

interface WaveToggleProps {
  id: string
  label: string
  value: number   // index of selected option (0, 1, or 2)
  onChange: (id: string, value: number) => void
  options?: string[]
}

export function WaveToggle({ id, label, value, onChange, options = ['OFF', 'ON'] }: WaveToggleProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 select-none" data-testid={`toggle-${id}`}>
      <div className="flex border border-zinc-700 rounded overflow-hidden">
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(id, i)}
            className={`px-2 py-1 text-[9px] font-mono font-bold transition-colors ${
              value === i ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <span className="text-[8px] text-zinc-500 uppercase tracking-wide text-center">{label}</span>
    </div>
  )
}
