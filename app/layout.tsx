import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'PatchLib',
  description: 'Analog synthesizer patch library for DFAM',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} font-mono bg-[#0a0a0a] text-zinc-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
