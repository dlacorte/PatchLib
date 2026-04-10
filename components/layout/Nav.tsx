import Link from 'next/link'
import { auth, signOut } from '@/auth'

export async function Nav({ activePage }: { activePage?: 'browse' | 'library' }) {
  const session = await auth()

  return (
    <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
      <Link
        href="/"
        className="text-orange-500 font-mono font-bold tracking-[4px] text-sm"
      >
        PATCHLIB
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/"
          className={`text-xs font-mono transition-colors ${
            activePage === 'browse'
              ? 'text-zinc-100 border-b border-orange-500 pb-px'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Browse
        </Link>

        {session && (
          <Link
            href="/library"
            className={`text-xs font-mono transition-colors ${
              activePage === 'library'
                ? 'text-zinc-100 border-b border-orange-500 pb-px'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            My Library
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <>
            <span className="text-[11px] font-mono text-zinc-600 hidden sm:block">
              {session.user?.email}
            </span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <button
                type="submit"
                className="text-xs font-mono text-zinc-500 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-500 transition-colors"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
