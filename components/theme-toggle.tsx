'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

function SunIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative h-8 w-16 rounded-full bg-black/8 border border-black/10 dark:bg-white/10 dark:border-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Sliding knob — CSS transform; cheap to repaint when the theme class flips. */}
      <div
        className="absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${isDark ? 32 : 0}px)` }}
      >
        {isDark ? (
          <MoonIcon className="h-3.5 w-3.5 text-slate-800" />
        ) : (
          <SunIcon className="h-3.5 w-3.5 text-primary" />
        )}
      </div>

      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
        <SunIcon className={`h-3 w-3 ${isDark ? 'opacity-30 text-white' : 'opacity-0'}`} />
        <MoonIcon className={`h-3 w-3 ${isDark ? 'opacity-0' : 'opacity-30 text-black/60'}`} />
      </div>
    </button>
  )
}
