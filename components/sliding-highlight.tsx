"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"

interface SlidingHighlightProps {
  children: ReactNode
  className?: string
  /** "default" uses primary/20, "light" uses white/25 for dark backgrounds */
  variant?: "default" | "light"
  /** Animation delay in seconds */
  delay?: number
}

export function SlidingHighlight({
  children,
  className = "",
  variant = "default",
  delay = 0.5,
}: SlidingHighlightProps) {
  const highlightColor =
    variant === "light" ? "bg-white/25" : "bg-primary/20"

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        className={`absolute bottom-0 left-0 right-0 h-3 rounded-full z-0 ${highlightColor}`}
        initial={{ scaleX: 0, rotate: 0 }}
        whileInView={{ scaleX: 1, rotate: -2 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
        style={{ originX: 0, transformOrigin: "left center" }}
      />
    </span>
  )
}
