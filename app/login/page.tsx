import Link from 'next/link'
import { signInWithPassword } from './actions'

interface LoginPageProps {
  searchParams: { error?: string; callbackUrl?: string }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const hasError = !!searchParams.error
  const callbackUrl = searchParams.callbackUrl || '/library'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Topbar */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <span className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">PATCHLIB</span>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <div>
            <h1 className="text-3xl font-mono font-bold text-orange-500 tracking-[0.25em] mb-1">
              PATCHLIB
            </h1>
            <p className="text-[11px] font-mono text-zinc-700 tracking-[0.2em] uppercase">
              Your Analog Patch Library
            </p>
          </div>

          <form action={signInWithPassword} className="w-full flex flex-col gap-3">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="your@email.com"
              className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <input
              type="password"
              name="password"
              required
              placeholder="Password"
              className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs tracking-widest uppercase px-3 py-2 rounded transition-colors"
            >
              Sign In
            </button>
          </form>

          {hasError && (
            <p className="text-xs font-mono text-red-400">
              Invalid email or password.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-900 px-6 py-3 flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-800">
          DFAM · SUBHARMONICON · MOTHER-32
        </span>
        <Link
          href="/"
          className="text-[10px] font-mono text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          Browse without account →
        </Link>
      </div>
    </div>
  )
}
