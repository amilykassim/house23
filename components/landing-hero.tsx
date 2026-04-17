"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useMotionValue, useTransform, useSpring } from "motion/react"
import { Star, ArrowRight } from "lucide-react"
import { houses } from "@/lib/houses"
import { VelstaysBrand } from "@/components/velstays-brand"
import { ThemeToggle } from "@/components/theme-toggle"

const house23 = houses.find((h) => h.slug === "house-23")!
const house22 = houses.find((h) => h.slug === "house-22")!

export function LandingHero() {
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse position for subtle parallax
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const springX = useSpring(mouseX, { stiffness: 150, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 30 })

  // Parallax transforms for left image
  const leftX = useTransform(springX, [0, 1], [8, -8])
  const leftY = useTransform(springY, [0, 1], [5, -5])

  // Parallax transforms for right image
  const rightX = useTransform(springX, [0, 1], [-8, 8])
  const rightY = useTransform(springY, [0, 1], [-5, 5])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative h-dvh w-full overflow-hidden bg-black select-none"
    >
      {/* ===== LEFT SIDE — House 23 ===== */}
      <Link
        href="/house/house-23"
        className="absolute inset-0 z-10 block"
        style={{ clipPath: "polygon(0 0, 62% 0, 38% 100%, 0 100%)" }}
        onMouseEnter={() => setHoveredSide("left")}
        onMouseLeave={() => setHoveredSide(null)}
        aria-label={`Explore ${house23.name}`}
      >
        {/* Image */}
        <motion.div
          className="absolute inset-[-20px]"
          style={{ x: leftX, y: leftY }}
          animate={{ scale: hoveredSide === "left" ? 1.05 : 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Image
            src={house23.heroImage}
            alt={`${house23.name} exterior`}
            fill
            className="object-cover"
            priority
            sizes="60vw"
          />
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        <motion.div
          className="absolute inset-0 bg-black/20"
          animate={{ opacity: hoveredSide === "right" ? 0.4 : 0 }}
          transition={{ duration: 0.5 }}
        />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-white">{house23.rating}</span>
                <span className="text-white/60 text-xs">({house23.reviewCount})</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-2">
              {house23.name}
            </h2>
            <p className="text-white/60 text-sm sm:text-base mb-4 max-w-xs leading-relaxed">
              Panoramic views. Natural light. Your private sanctuary.
            </p>

            {/* Price + CTA */}
            <div className="flex items-center gap-4">
              <span className="text-white text-lg sm:text-xl font-semibold">
                ${house23.pricePerNight}<span className="text-white/50 text-sm font-normal">/night</span>
              </span>
              <motion.span
                className="inline-flex items-center gap-1 text-white/80 text-sm font-medium"
                animate={{ x: hoveredSide === "left" ? 4 : 0 }}
                transition={{ duration: 0.3 }}
              >
                Explore <ArrowRight className="h-4 w-4" />
              </motion.span>
            </div>
          </motion.div>
        </div>
      </Link>

      {/* ===== RIGHT SIDE — House 22 ===== */}
      <Link
        href="/house/house-22"
        className="absolute inset-0 z-10 block"
        style={{ clipPath: "polygon(62% 0, 100% 0, 100% 100%, 38% 100%)" }}
        onMouseEnter={() => setHoveredSide("right")}
        onMouseLeave={() => setHoveredSide(null)}
        aria-label={`Explore ${house22.name}`}
      >
        {/* Image */}
        <motion.div
          className="absolute inset-[-20px]"
          style={{ x: rightX, y: rightY }}
          animate={{ scale: hoveredSide === "right" ? 1.05 : 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Image
            src={house22.heroImage}
            alt={`${house22.name} exterior`}
            fill
            className="object-cover"
            priority
            sizes="60vw"
          />
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        <motion.div
          className="absolute inset-0 bg-black/20"
          animate={{ opacity: hoveredSide === "left" ? 0.4 : 0 }}
          transition={{ duration: 0.5 }}
        />

        {/* Content */}
        <div className="absolute bottom-0 right-0 left-0 p-6 sm:p-10 lg:p-16 text-right">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {/* Rating */}
            <div className="flex items-center justify-end gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-white">{house22.rating}</span>
                <span className="text-white/60 text-xs">({house22.reviewCount})</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-2">
              {house22.name}
            </h2>
            <p className="text-white/60 text-sm sm:text-base mb-4 max-w-xs ml-auto leading-relaxed">
              Game room. Total privacy. Your personal retreat.
            </p>

            {/* Price + CTA */}
            <div className="flex items-center justify-end gap-4">
              <motion.span
                className="inline-flex items-center gap-1 text-white/80 text-sm font-medium"
                animate={{ x: hoveredSide === "right" ? -4 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="h-4 w-4 rotate-180" /> Explore
              </motion.span>
              <span className="text-white text-lg sm:text-xl font-semibold">
                ${house22.pricePerNight}<span className="text-white/50 text-sm font-normal">/night</span>
              </span>
            </div>
          </motion.div>
        </div>
      </Link>

      {/* ===== DIAGONAL LINE (decorative) ===== */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        aria-hidden="true"
      >
        {/* The glowing diagonal line */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="diagonal-glow" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="30%" stopColor="white" stopOpacity="0.6" />
              <stop offset="50%" stopColor="white" stopOpacity="0.9" />
              <stop offset="70%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.line
            x1="62%"
            y1="0"
            x2="38%"
            y2="100%"
            stroke="url(#diagonal-glow)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </svg>
      </div>

      {/* ===== CENTER BRAND ===== */}
      <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {/* Glow background */}
          <div
            className="absolute inset-0 -m-12 rounded-full"
            style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 40%, transparent 70%)" }}
          />
          <div className="relative px-8 py-4">
            <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight">
              <VelstaysBrand variant="light" delay={1} />
            </span>
            <motion.p
              className="text-center text-white/50 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mt-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              Kigali, Rwanda
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* ===== TOP BAR ===== */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Left: tagline */}
          <motion.p
            className="text-white/40 text-xs sm:text-sm tracking-widest uppercase font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            Choose your stay
          </motion.p>

          {/* Right: theme toggle */}
          <motion.div
            className="pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <ThemeToggle />
          </motion.div>
        </div>
      </div>

      {/* ===== BOTTOM SCROLL HINT ===== */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div className="w-1 h-2 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </div>
  )
}
