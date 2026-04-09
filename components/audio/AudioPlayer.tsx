'use client'

import { useRef, useState } from 'react'

interface AudioPlayerProps {
  src: string
  filename?: string
}

const BAR_COUNT = 40

function seededHeight(seed: string, index: number): number {
  let h = 0
  const s = `${seed}:${index}`
  for (let j = 0; j < s.length; j++) {
    h = (h * 31 + s.charCodeAt(j)) & 0xffff
  }
  return 20 + (h % 60)
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function AudioPlayer({ src, filename }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const progress = duration > 0 ? currentTime / duration : 0
  const playedBars = Math.floor(progress * BAR_COUNT)
  const seed = filename || src

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
  }

  const displayName = filename ?? src.split('/').pop() ?? 'audio.mp3'

  return (
    <div className="bg-[#111] border border-zinc-800 rounded-md overflow-hidden">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Waveform + controls */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-400 flex items-center justify-center text-black text-[11px] flex-shrink-0 transition-colors"
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Waveform bars */}
        <div className="flex items-center gap-[2px] flex-1 h-8">
          {Array.from({ length: BAR_COUNT }, (_, i) => {
            const h = seededHeight(seed, i)
            const isPlayed = i < playedBars
            const isHead = i === playedBars
            return (
              <span
                key={`bar-${i}`}
                data-bar
                className={`inline-block w-[3px] rounded-sm flex-shrink-0 transition-colors ${
                  isHead
                    ? 'bg-orange-300'
                    : isPlayed
                    ? 'bg-orange-500'
                    : 'bg-zinc-700'
                }`}
                style={{ height: `${h}%` }}
              />
            )
          })}
        </div>

        <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
          {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
        </span>
      </div>

      {/* Footer: filename + download */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-600 truncate">{displayName}</span>
        <a
          href={src}
          download
          aria-label="Download"
          className="text-[10px] font-mono text-zinc-600 hover:text-orange-500 transition-colors ml-4 flex-shrink-0"
        >
          ↓ download
        </a>
      </div>
    </div>
  )
}
