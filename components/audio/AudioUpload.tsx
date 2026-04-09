'use client'

import { useRef, useState } from 'react'

const MAX_BYTES = 10 * 1024 * 1024

interface AudioUploadProps {
  value: string
  onChange: (url: string) => void
}

function seededHeight(seed: string, index: number): number {
  let h = 0
  const s = seed + index
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

const BAR_COUNT = 24

export function AudioUpload({ value, onChange }: AudioUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [filename, setFilename] = useState('')

  const progress = duration > 0 ? currentTime / duration : 0
  const playedBars = Math.floor(progress * BAR_COUNT)

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      setError('File exceeds 10 MB limit')
      return
    }
    if (file.type !== 'audio/mpeg' && !file.name.endsWith('.mp3')) {
      setError('Only MP3 files are accepted')
      return
    }
    setError('')
    setUploading(true)
    try {
      const presignRes = await fetch('/api/audio/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'audio/mpeg' }),
      })
      if (!presignRes.ok) throw new Error('Presign failed')
      const { uploadUrl, publicUrl } = await presignRes.json()

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'audio/mpeg' },
        body: file,
      })

      setFilename(file.name)
      onChange(publicUrl)
    } catch {
      setError('Upload failed — try again')
    } finally {
      setUploading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  function handleRemove() {
    setFilename('')
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const seed = filename || value

  if (value) {
    return (
      <div className="bg-[#111] border border-zinc-800 rounded px-3 py-2 flex items-center gap-3">
        <audio
          ref={audioRef}
          src={value}
          onTimeUpdate={e => {
            const a = e.currentTarget
            setCurrentTime(a.currentTime)
          }}
          onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
        />
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={togglePlay}
          className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-black text-[9px] flex-shrink-0"
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div className="flex items-center gap-[2px] flex-1 h-5">
          {Array.from({ length: BAR_COUNT }, (_, i) => {
            const h = seededHeight(seed, i)
            const isPlayed = i < playedBars
            return (
              <span
                key={i}
                className={`inline-block w-[2px] rounded-sm flex-shrink-0 ${isPlayed ? 'bg-orange-500' : 'bg-zinc-700'}`}
                style={{ height: `${h}%` }}
              />
            )
          })}
        </div>
        <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
          {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
        </span>
        <button
          type="button"
          aria-label="Remove"
          onClick={handleRemove}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error ? (
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-mono text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="bg-[#111] border border-zinc-700 rounded px-3 py-1.5 text-[10px] font-mono text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading…' : '+ Attach MP3'}
          </button>
          <span className="text-[10px] font-mono text-zinc-600">max 10 MB</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
