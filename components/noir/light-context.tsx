"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"

interface LightState {
  lampOn: boolean
  setLampOn: (on: boolean) => void
  storyDone: boolean
  setStoryDone: (done: boolean) => void
}

const LightContext = createContext<LightState | null>(null)

export function useLight() {
  const ctx = useContext(LightContext)
  if (!ctx) throw new Error("useLight must be used inside <LightProvider>")
  return ctx
}

export function LightProvider({ children }: { children: React.ReactNode }) {
  // The page opens with the lights off — the torch is the first thing you learn.
  const [lampOn, setLampOn] = useState(false)
  const [storyDone, setStoryDone] = useState(false)

  return (
    <LightContext.Provider value={{ lampOn, setLampOn, storyDone, setStoryDone }}>
      {children}
    </LightContext.Provider>
  )
}

/** Full-page darkness with a transparent circle that follows the cursor. */
export function Torch() {
  const { lampOn } = useLight()
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ tx: 0, ty: 0, cx: 0, cy: 0 })

  useEffect(() => {
    pos.current.tx = pos.current.cx = window.innerWidth / 2
    pos.current.ty = pos.current.cy = window.innerHeight * 0.38

    const onMove = (e: MouseEvent) => {
      pos.current.tx = e.clientX
      pos.current.ty = e.clientY
    }
    document.addEventListener("mousemove", onMove, { passive: true })

    let raf = 0
    const loop = () => {
      const p = pos.current
      p.cx += (p.tx - p.cx) * 0.18
      p.cy += (p.ty - p.cy) * 0.18
      if (ref.current) {
        ref.current.style.background = `radial-gradient(circle 240px at ${p.cx}px ${p.cy}px, transparent 0%, rgba(4,4,6,0.66) 58%, rgba(4,4,6,0.78) 100%)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      document.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="torch-only fixed inset-0 z-30 pointer-events-none transition-opacity duration-700"
      style={{ opacity: lampOn ? 0 : 1 }}
    />
  )
}
