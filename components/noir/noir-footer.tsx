"use client"

import Link from "next/link"
import { motion } from "motion/react"

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 1 },
} as const

export function NoirFooter() {
  return (
    <footer id="book" className="relative z-[34] px-4 sm:px-8 pt-32 sm:pt-44 pb-8 text-center">
      <motion.h2
        {...fadeUp}
        className="mx-auto text-[clamp(2.4rem,7vw,6.4rem)] font-medium tracking-[-0.025em] leading-[0.96] text-balance"
      >
        Some stays you remember.{" "}
        <em className="not-italic text-primary">This one you&apos;ll miss.</em>
      </motion.h2>
      <motion.p {...fadeUp} className="mx-auto mt-7 mb-10 max-w-md text-muted-foreground">
        Book directly with us for the best nightly rate — replies within the day, usually much faster.
      </motion.p>
      <motion.div {...fadeUp} className="inline-block">
        <Link
          href="#houses"
          className="inline-flex items-center min-h-12 rounded-full border border-primary px-10 text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-primary transition-all duration-400 hover:bg-primary hover:text-primary-foreground hover:[box-shadow:0_0_40px_rgba(220,166,63,0.35)]"
        >
          Check availability
        </Link>
      </motion.div>

      <div className="mt-20 pt-5 border-t border-border flex flex-wrap justify-between gap-4 text-[0.82rem] text-muted-foreground">
        <span>Velstays — Kicukiro, Kigali, Rwanda ©{new Date().getFullYear()}</span>
        <span className="flex gap-7">
          <Link href="/house-rules" className="hover:text-foreground transition-colors">
            House rules
          </Link>
          <Link href="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/cancellation-policy" className="hover:text-foreground transition-colors">
            Cancellation
          </Link>
        </span>
      </div>
    </footer>
  )
}
