"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// The back office's motion helpers. The look of each effect lives in
// app/globals.css under .admin-motion; these handle the timing.

/** Rise-in for the i-th block on a page: spread `{...rise(i)}` on it. */
export const rise = (i: number, step = 60) => ({ className: "m-rise", style: { animationDelay: `${i * step}ms` } })

const prefersReducedMotion = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * A number that counts up once, the first time `ready` is true. Every later
 * change shows at once: counting again on each filter would be too much.
 */
export function useCountUp(target: number, ready: boolean, duration = 950): number {
    const [shown, setShown] = useState(0)
    const done = useRef(false)
    const frame = useRef<number | null>(null)

    useEffect(() => {
        if (!ready) return
        if (done.current) {
            setShown(target)
            return
        }
        done.current = true
        if (prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
            setShown(target)
            return
        }
        const start = performance.now()
        // Timed off performance.now on both ends, never the frame's own timestamp
        const step = () => {
            const t = Math.min(1, (performance.now() - start) / duration)
            setShown(target * (1 - Math.pow(1 - t, 4)))
            if (t < 1) frame.current = requestAnimationFrame(step)
        }
        frame.current = requestAnimationFrame(step)
        return () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current)
            // Cut short (the target changed mid-count): land on the new value
            setShown(target)
        }
    }, [target, ready, duration])

    return ready && done.current ? shown : 0
}

/**
 * A number that glides from its old value to its new one, but only when
 * `trigger` changes (e.g. a Before/After switch). Any other change shows at
 * once, like useCountUp. Reduced motion: always at once.
 */
export function useTween(value: number, trigger: unknown, duration = 650): number {
    const [shown, setShown] = useState(value)
    const [moving, setMoving] = useState(false)
    const lastTrigger = useRef(trigger)
    const shownRef = useRef(value)
    const frame = useRef<number | null>(null)
    // The render where the trigger flipped holds the old figure until the glide starts
    const flipped = lastTrigger.current !== trigger

    useEffect(() => {
        const animate = lastTrigger.current !== trigger
        console.warn('TWEEN effect', value, String(trigger), 'animate', animate, 'reduce', prefersReducedMotion())
        lastTrigger.current = trigger
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        frame.current = null
        if (!animate || prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
            shownRef.current = value
            setShown(value)
            setMoving(false)
            return
        }
        const from = shownRef.current
        const start = performance.now()
        setMoving(true)
        const step = () => {
            const t = Math.min(1, (performance.now() - start) / duration)
            shownRef.current = from + (value - from) * (1 - Math.pow(1 - t, 4))
            setShown(shownRef.current)
            if (t < 1) {
                frame.current = requestAnimationFrame(step)
            } else {
                frame.current = null
                setMoving(false)
            }
        }
        frame.current = requestAnimationFrame(step)
    }, [value, trigger, duration])

    useEffect(() => () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current)
    }, [])

    console.warn('TWEEN render', value, String(trigger), 'flipped', flipped, 'moving', moving, 'shown', shown)
    if (flipped) return shownRef.current
    return moving ? shown : value
}

/** False until shortly after `ready`, so bars can grow from nothing to their size. */
export function useGrown(ready: boolean, delay = 120): boolean {
    const [grown, setGrown] = useState(false)
    useEffect(() => {
        if (!ready || grown) return
        const timer = setTimeout(() => setGrown(true), delay)
        return () => clearTimeout(timer)
    }, [ready, grown, delay])
    return grown
}

const COLLAPSE_MS = 340

/**
 * A panel whose height glides open and shut. Its content is only in the page
 * while open (and while it glides shut), so closed panels can't be tabbed
 * into, read out, or found with find-in-page.
 */
export function Collapse({ open, id, children, className = "" }: { open: boolean; id?: string; children: React.ReactNode; className?: string }) {
    const [mounted, setMounted] = useState(open)
    // Lags `open` by a frame on the way in, so the height starts from zero
    const [expanded, setExpanded] = useState(open)

    useEffect(() => {
        if (open) {
            setMounted(true)
            if (typeof requestAnimationFrame !== "function") {
                setExpanded(true)
                return
            }
            let second = 0
            const first = requestAnimationFrame(() => {
                second = requestAnimationFrame(() => setExpanded(true))
            })
            return () => {
                cancelAnimationFrame(first)
                cancelAnimationFrame(second)
            }
        }
        setExpanded(false)
        const timer = setTimeout(() => setMounted(false), COLLAPSE_MS)
        return () => clearTimeout(timer)
    }, [open])

    return (
        <div id={id} className={`m-collapse ${className}`} data-open={expanded && open} inert={!open} aria-hidden={!open}>
            <div>{mounted && children}</div>
        </div>
    )
}

/** Shimmering placeholder blocks while a page loads. */
export function Skeleton({ className = "" }: { className?: string }) {
    return <div aria-hidden="true" className={`m-skeleton ${className}`} />
}

// ---------------------------------------------------------- undoable actions
//
// The action is shown as done at once and sent when the toast runs out, so
// Undo has nothing to take back on the server. If the tab is closed before
// then, whatever is still waiting is sent on the way out.

export const UNDO_MS = 4500
const waiting = new Map<number, () => void>()
let nextId = 1

if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
        for (const send of Array.from(waiting.values())) send()
    })
}

export function UndoToast({ title, description, onUndo }: { title: string; description?: string; onUndo: () => void }) {
    return (
        <div
            role="status"
            className="w-[min(420px,calc(100vw-32px))] rounded-2xl bg-[#222222] text-white shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)] overflow-hidden font-sans"
        >
            <div className="pl-[18px] pr-2.5 py-3.5 flex items-center gap-3">
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                    <span className="text-sm font-bold">{title}</span>
                    {description && <span className="text-[13px] text-[#D4D4D4] [overflow-wrap:anywhere]">{description}</span>}
                </div>
                <button
                    type="button"
                    onClick={onUndo}
                    className="shrink-0 min-h-10 px-3.5 rounded-full bg-white/15 text-sm font-bold text-white hover:bg-white/25 transition-colors"
                >
                    Undo
                </button>
            </div>
            <div className="m-fuse h-[3px] bg-[#DDAE55]" style={{ ["--m-fuse" as string]: `${UNDO_MS}ms` }} />
        </div>
    )
}

/**
 * Shows `title` with an Undo button for UNDO_MS. If nobody presses Undo, `send`
 * runs (when the toast runs out, is swiped away, or the tab closes); if they
 * do, `undo` runs and nothing is sent. Exactly one of the two runs.
 */
export function undoable({ title, description, send, undo }: { title: string; description?: string; send: () => void; undo: () => void }) {
    const key = nextId++
    let settled = false
    const commit = () => {
        if (settled) return
        settled = true
        waiting.delete(key)
        send()
    }
    waiting.set(key, commit)
    const toastId = toast.custom(
        (id) => (
            <UndoToast
                title={title}
                description={description}
                onUndo={() => {
                    if (settled) return
                    settled = true
                    waiting.delete(key)
                    undo()
                    toast.dismiss(id)
                }}
            />
        ),
        { duration: UNDO_MS, onAutoClose: commit, onDismiss: commit, unstyled: true }
    )
    return toastId
}
