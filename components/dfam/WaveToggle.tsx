'use client'

interface WaveToggleProps {
  id: string
  label: string
  value: number   // index of selected option (0, 1, or 2)
  onChange: (id: string, value: number) => void
  options?: string[]
}

export function WaveToggle({ id, label, value, onChange, options = ['OFF', 'ON'] }: WaveToggleProps) {
  const isThree = options.length >= 3
  const bodyH = isThree ? 36 : 28

  // Lever top position in px within the switch body
  const leverTop =
    value === 0
      ? 2
      : isThree && value === 1
      ? Math.floor((bodyH - 9) / 2)
      : bodyH - 11

  return (
    <div className="flex flex-col items-center gap-1 select-none" data-testid={`toggle-${id}`}>
      <div className="flex items-center gap-1.5">
        {/* Switch body — visual lever */}
        <div
          className="relative bg-[#141414] border border-zinc-600 rounded flex-shrink-0"
          style={{ width: 13, height: bodyH }}
        >
          <div
            className="absolute bg-zinc-300 rounded-sm transition-[top] duration-100 ease-in-out"
            style={{
              width: 8,
              height: 9,
              left: '50%',
              transform: 'translateX(-50%)',
              top: leverTop,
            }}
          />
        </div>

        {/* Option labels — each a clickable button */}
        <div className="flex flex-col" style={{ gap: isThree ? 3 : 5 }}>
          {options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(id, i)}
              className={`text-[8px] font-mono leading-none transition-colors ${
                value === i ? 'text-orange-400 font-bold' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Control label */}
      <span
        className="text-zinc-500 uppercase tracking-wide text-center leading-tight"
        style={{ fontSize: 9, maxWidth: 52 }}
      >
        {label}
      </span>
    </div>
  )
}
