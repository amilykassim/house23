"use client"

import { useEffect, useRef } from "react"

/**
 * Re-runs `callback` every `intervalMs` while `enabled` is true and the tab is
 * visible. Also fires as soon as the tab regains focus/visibility so a change
 * that happened while the user was away shows up right away.
 *
 * `immediate` runs the callback once as soon as polling becomes enabled.
 */
export function usePolling(
    callback: () => void | Promise<void>,
    intervalMs: number,
    enabled = true,
    immediate = false
) {
    const callbackRef = useRef(callback)
    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    useEffect(() => {
        if (!enabled) return

        const run = () => {
            if (document.visibilityState === "visible") {
                void callbackRef.current()
            }
        }

        if (immediate) run()

        const id = window.setInterval(run, intervalMs)
        document.addEventListener("visibilitychange", run)
        window.addEventListener("focus", run)

        return () => {
            window.clearInterval(id)
            document.removeEventListener("visibilitychange", run)
            window.removeEventListener("focus", run)
        }
    }, [intervalMs, enabled, immediate])
}
