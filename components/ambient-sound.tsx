'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const STORAGE_KEY = 'velstays:ambient-sound'
const AUDIO_SRC = '/audio/background-audio.mp3'
const VOLUME = 0.25

type AmbientSoundContextValue = {
  enabled: boolean
  toggle: () => void
}

const AmbientSoundContext = createContext<AmbientSoundContextValue | null>(null)

export function AmbientSoundProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    // Default to muted — friendlier first impression. User opts in via the toggle.
    setEnabled(stored === 'on')
  }, [])

  // Restore-on-mount only. User toggles drive play/pause directly from the click
  // handler so the call happens inside the browser's user-gesture window.
  useEffect(() => {
    if (!mounted) return
    if (!enabled) return
    const audio = audioRef.current
    if (!audio) return
    audio.volume = VOLUME
    audio.play().catch(() => {
      // No gesture yet on this page load — wait for the first one.
      const resume = () => {
        audio.play().catch(() => {})
        window.removeEventListener('pointerdown', resume)
        window.removeEventListener('keydown', resume)
      }
      window.addEventListener('pointerdown', resume, { once: true })
      window.addEventListener('keydown', resume, { once: true })
    })
    // Intentionally exclude `enabled` — toggles are handled in `toggle()`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  const toggle = () => {
    const audio = audioRef.current
    const next = !enabled
    // Drive the audio element synchronously in the gesture context. Mobile
    // browsers (iOS Safari especially) refuse play() called from a later
    // microtask/effect even if the gesture started the chain.
    if (audio) {
      audio.volume = VOLUME
      if (next) {
        audio.play().catch(() => {})
      } else {
        audio.pause()
      }
    }
    localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
    setEnabled(next)
  }

  return (
    <AmbientSoundContext.Provider value={{ enabled, toggle }}>
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" />
      {children}
    </AmbientSoundContext.Provider>
  )
}

function useAmbientSound() {
  const ctx = useContext(AmbientSoundContext)
  if (!ctx) throw new Error('useAmbientSound must be used inside AmbientSoundProvider')
  return ctx
}

function SoundOnIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function SoundOffIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  )
}

function HintDoodle({ show }: { show: boolean }) {
  const { enabled } = useAmbientSound()
  const [baseline, setBaseline] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // Capture the audio state at the moment the hint becomes visible.
  useEffect(() => {
    if (show && baseline === null) setBaseline(enabled)
  }, [show, baseline, enabled])

  // Dismiss as soon as the user actually toggles the audio.
  useEffect(() => {
    if (baseline === null) return
    if (enabled !== baseline) setDismissed(true)
  }, [enabled, baseline])

  // Auto-dismiss so it doesn't linger forever.
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setDismissed(true), 12000)
    return () => clearTimeout(t)
  }, [show])

  const visible = show && !dismissed

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="ambient-hint"
          style={{ perspective: 700 }}
          className="absolute left-full top-1/2 -translate-y-1/2 ml-8 z-20 select-none cursor-pointer"
          initial={{ opacity: 0, x: -14, scale: 0.55, rotate: -10 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            rotate: -3,
            transition: {
              delay: 1.2,
              type: 'spring',
              stiffness: 200,
              damping: 14,
            },
          }}
          exit={{ opacity: 0, x: -8, scale: 0.6, transition: { duration: 0.2 } }}
          onClick={() => setDismissed(true)}
        >
          {/* Long squiggly arrow snaking left toward the button.
              pointer-events-none so taps that land on the arrow (which overlaps
              the button on mobile) fall through to the button itself instead of
              being swallowed by the doodle's dismiss handler. */}
          <svg
            className="absolute -left-16 top-1/2 -translate-y-1/2 text-primary/80 pointer-events-none"
            width="64"
            height="36"
            viewBox="0 0 64 36"
            fill="none"
            aria-hidden
          >
            <motion.path
              d="M 60 6 C 52 4, 56 22, 46 14 C 36 8, 42 28, 32 18"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.6, duration: 0.85, ease: 'easeInOut' }}
            />
            <motion.path
              d="M 32 18 L 38 15 M 32 18 L 38 21"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.4, duration: 0.25 }}
            />
          </svg>

          {/* Sticky-note doodle with subtle 3D tilt on hover */}
          <motion.div
            whileHover={{
              rotateX: -8,
              rotateY: -10,
              scale: 1.05,
              transition: { type: 'spring', stiffness: 200, damping: 12 },
            }}
            className="font-doodle leading-tight px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-700/40 text-amber-900 dark:text-amber-100 text-center max-w-48 sm:max-w-none"
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 14px -4px rgba(180,130,30,0.30), 0 18px 32px -10px rgba(0,0,0,0.20)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="font-sans text-[0.55rem] sm:text-[0.65rem] uppercase tracking-[0.25em] opacity-60">Hey...</div>
            <div className="text-xl sm:text-2xl whitespace-nowrap">Explore in style?</div>
            <div className="text-base sm:text-lg text-primary -mt-0.5">Tap here!</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type ToggleProps = {
  show?: boolean
  className?: string
}

export function AmbientSoundToggle({ show = true, className }: ToggleProps) {
  const { enabled, toggle } = useAmbientSound()

  return (
    <span className="relative inline-block align-middle ml-2 translate-y-[0.4em] sm:-translate-y-[0.18em]">
      <AnimatePresence>
        {show && (
          <motion.button
            key="ambient-btn"
            onClick={toggle}
            aria-label={enabled ? 'Mute ambient sound' : 'Play ambient sound'}
            aria-pressed={enabled}
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
              transition: {
                type: 'spring',
                stiffness: 220,
                damping: 12,
                mass: 0.7,
                delay: 0.15,
              },
            }}
            exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.15 } }}
            whileHover={{ scale: 1.12, rotate: 6 }}
            whileTap={{ scale: 0.92 }}
            className={`relative inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/25 text-primary shadow-[0_4px_20px_-4px_rgba(120,80,220,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className ?? ''}`}
          >
            {/* One-time bloom ring */}
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/40 pointer-events-none"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 2.6, opacity: [0, 0.55, 0] }}
              transition={{ duration: 1.1, delay: 0.4, ease: 'easeOut' }}
            />

            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={enabled ? 'on' : 'off'}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                className="relative flex"
              >
                {enabled ? (
                  <SoundOnIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                ) : (
                  <SoundOffIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      <HintDoodle show={show} />
    </span>
  )
}
