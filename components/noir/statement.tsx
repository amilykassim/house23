"use client"

import { motion } from "motion/react"
import { useLight } from "./light-context"

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 1 },
} as const

/** Short amber-accented story beat between photo walls. Sits above the torch layer. */
export function Statement({
  index,
  label,
  title,
  body,
  children,
  id,
}: {
  index: string
  label: string
  title: React.ReactNode
  body?: string
  children?: React.ReactNode
  id?: string
}) {
  return (
    <section id={id} className="relative z-[34] max-w-5xl px-4 sm:px-8 pt-28 sm:pt-40 pb-12 sm:pb-16">
      <motion.p {...fadeUp} className="text-[0.8rem] font-semibold uppercase tracking-[0.4em] text-primary mb-5">
        {index} — {label}
      </motion.p>
      <motion.h2
        {...fadeUp}
        className="text-[clamp(1.9rem,4.6vw,4rem)] font-medium tracking-[-0.022em] leading-[1.08] text-balance"
      >
        {title}
      </motion.h2>
      {body && (
        <motion.p {...fadeUp} className="mt-5 max-w-2xl text-[1.08rem] text-muted-foreground">
          {body}
        </motion.p>
      )}
      {children}
    </section>
  )
}

/** Desktop-only reminder that the torch exists, with a pulsing bulb. */
export function TorchHint() {
  const { lampOn } = useLight()
  return (
    <motion.p
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1 }}
      className="torch-only-flex items-center gap-3 mt-8 text-[0.88rem] text-muted-foreground"
    >
      <span className="w-2 h-2 rounded-full bg-primary [box-shadow:0_0_14px_3px_rgba(220,166,63,0.65)] animate-pulse flex-none" />
      <span>
        {lampOn
          ? "The lights are on — tap the lamp anytime to go back to the dark."
          : "The lights are off — sweep your torch around, or tap the lamp to turn everything on."}
      </span>
    </motion.p>
  )
}
