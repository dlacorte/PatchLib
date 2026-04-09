'use client'

interface WaveToggleProps {
  id: string
  label: string
  value: number   // 0 = first option, 1 = second option
  onChange: (id: string, value: number) => void
  options?: [string, string]
}

export function WaveToggle({ id, label, value, onChange, options = ['OFF', 'ON'] }: WaveToggleProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 select-none" data-testid={`toggle-${id}`}>
      <div className="flex border border-zinc-700 rounded overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(id, 0)}
          className={`px-2 py-1 text-[9px] font-mono font-bold transition-colors ${
            value === 0 ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {options[0]}
        </button>
        <button
          type="button"
          onClick={() => onChange(id, 1)}
          className={`px-2 py-1 text-[9px] font-mono font-bold transition-colors ${
            value === 1 ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {options[1]}
        </button>
      </div>
      <span className="text-[8px] text-zinc-500 uppercase tracking-wide text-center">{label}</span>
    </div>
  )
}
