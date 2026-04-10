'use client'

interface VisibilityToggleProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  return (
    <div
      className={`flex items-center justify-between rounded px-3 py-2 border transition-colors ${
        value ? 'border-green-900' : 'border-zinc-800'
      } bg-[#111]`}
    >
      <span className="text-sm font-mono text-zinc-500">Make this patch public</span>
      <button
        type="button"
        role="button"
        onClick={() => onChange(!value)}
        className="flex items-center gap-2 select-none"
      >
        <span
          className={`relative inline-flex w-7 h-4 rounded-full transition-colors ${
            value ? 'bg-green-900' : 'bg-zinc-800'
          } border ${value ? 'border-green-700' : 'border-zinc-700'}`}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
              value ? 'left-3.5 bg-green-500' : 'left-0.5 bg-zinc-600'
            }`}
          />
        </span>
        <span
          className={`text-xs font-mono w-10 text-left transition-colors ${
            value ? 'text-green-600' : 'text-zinc-600'
          }`}
        >
          {value ? 'public' : 'private'}
        </span>
      </button>
    </div>
  )
}
