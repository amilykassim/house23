"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Sparkles } from "lucide-react"

export function SavingsBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem("savingsBannerSeen") === "true") return
    const timer = setTimeout(() => setShow(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setShow(false)
    sessionStorage.setItem("savingsBannerSeen", "true")
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm pointer-events-auto"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
            {/* Background with subtle gradient */}
            <div className="absolute inset-0 bg-card" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.08]" />

            {/* Glowing top edge */}
            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Dismiss button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/60 hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            <div className="relative p-5">
              {/* Header with sparkle */}
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Direct booking perk
                </p>
              </div>

              {/* Main message */}
              <p className="text-[15px] font-semibold text-foreground leading-snug mb-4">
                Save <span className="text-primary">$10 every night</span> when you book directly with us
              </p>

              {/* Price comparison cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Airbnb */}
                <div className="rounded-xl bg-muted/50 border border-border/60 p-3 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Airbnb
                  </p>
                  <p className="text-xl font-bold text-muted-foreground/60 line-through decoration-destructive/60 decoration-2">
                    $61
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">per night</p>
                </div>

                {/* Direct */}
                <div className="relative rounded-xl bg-primary/[0.08] border border-primary/20 p-3 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm"
                  >
                    Save 20%
                  </motion.div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-primary/60 mb-2">
                    Direct
                  </p>
                  <motion.p
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="text-xl font-bold text-primary"
                  >
                    $51
                  </motion.p>
                  <p className="text-[10px] text-primary/60 mt-0.5">per night</p>
                </div>
              </div>

              {/* Subtle footer */}
              <p className="text-[11px] text-center text-muted-foreground/70 mt-3.5">
                No middleman · No extra fees · Book right here
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
