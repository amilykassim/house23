"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { Star, ArrowUpRight } from "lucide-react"
import { houses } from "@/lib/houses"
import { ThemeToggle } from "@/components/theme-toggle"

const house23 = houses.find((h) => h.slug === "house-23")!
const house22 = houses.find((h) => h.slug === "house-22")!

function HouseCard({
  house,
  index,
  hoveredIndex,
  onHover,
}: {
  house: typeof house23
  index: number
  hoveredIndex: number | null
  onHover: (i: number | null) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)

  const rotateX = useSpring(rawRotateX, { stiffness: 200, damping: 25 })
  const rotateY = useSpring(rawRotateY, { stiffness: 200, damping: 25 })

  // Glare position derived from tilt
  const glareX = useTransform(rawRotateY, [-15, 15], [0, 100])
  const glareY = useTransform(rawRotateX, [15, -15], [0, 100])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      rawRotateX.set(y * -20)
      rawRotateY.set(x * 20)
    },
    [rawRotateX, rawRotateY]
  )

  const handleMouseLeave = useCallback(() => {
    rawRotateX.set(0)
    rawRotateY.set(0)
    onHover(null)
  }, [rawRotateX, rawRotateY, onHover])

  const isHovered = hoveredIndex === index
  const isSiblingHovered = hoveredIndex !== null && hoveredIndex !== index

  return (
    <motion.div
      className="relative w-full"
      style={{ perspective: "1200px" }}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.9,
        delay: 0.4 + index * 0.2,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{
          scale: isHovered ? 1.03 : isSiblingHovered ? 0.96 : 1,
          filter: isSiblingHovered
            ? "brightness(0.5)"
            : "brightness(1)",
        }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative rounded-2xl overflow-hidden will-change-transform ring-1 ring-black/5 dark:ring-white/5"
      >
        <Link
          href={`/house/${house.slug}`}
          className="block relative aspect-3/4 sm:aspect-4/5"
          aria-label={`Explore ${house.name}`}
        >
          {/* Image */}
          <Image
            src={house.heroImage}
            alt={`${house.name} exterior`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 90vw, 45vw"
          />

          {/* Vignette */}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20" />

          {/* Glare effect */}
          <motion.div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
            style={{
              opacity: isHovered ? 0.12 : 0,
              background: useTransform(
                [glareX, glareY],
                ([x, y]) =>
                  `radial-gradient(circle at ${x}% ${y}%, white, transparent 60%)`
              ),
            }}
          />

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-7">
            {/* Top: Rating */}
            <div className="flex justify-end">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-white">
                  {house.rating}
                </span>
                <span className="text-white/50 text-xs">
                  ({house.reviewCount})
                </span>
              </div>
            </div>

            {/* Bottom: Info */}
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-1.5 tracking-tight">
                {house.name}
              </h2>
              <p className="text-white/50 text-sm mb-4 max-w-70 leading-relaxed">
                {house.highlights[0].description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-white text-xl font-semibold">
                  ${house.pricePerNight}
                  <span className="text-white/40 text-sm font-normal">
                    /night
                  </span>
                </span>
                <motion.div
                  className="flex items-center gap-1 text-white/70 text-sm font-medium"
                  animate={{ x: isHovered ? 3 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Explore
                  <ArrowUpRight className="h-4 w-4" />
                </motion.div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Shadow beneath card */}
      <motion.div
        className="absolute -bottom-4 left-[10%] right-[10%] h-12 rounded-[50%] bg-black/5 dark:bg-white/3 blur-xl -z-10"
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  )
}

const TYPEWRITER_TEXT = "One unforgettable stay"
const TYPEWRITER_DELAY = 1200 // ms before typing starts (after heading animates in)
const TYPEWRITER_SPEED = 70 // ms per character

function useTypewriter(text: string, delay: number, speed: number) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, speed)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, delay, speed])

  return { displayed, done }
}

export function LandingHero() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT, TYPEWRITER_DELAY, TYPEWRITER_SPEED)

  return (
    <div className="relative min-h-dvh w-full bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden transition-colors duration-500">
      {/* Noise grain texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Ambient glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] rounded-full bg-primary/10 dark:bg-primary/6 blur-[120px] pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="font-serif text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight transition-colors duration-500">
            Velstays
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <ThemeToggle />
        </motion.div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100dvh-5rem)] px-6 sm:px-10 lg:px-16">
        {/* Headline */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.p
            className="text-gray-400 dark:text-white/30 text-xs sm:text-sm tracking-[0.3em] uppercase font-medium mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Kigali, Rwanda
          </motion.p>
          <motion.h1
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-900 dark:text-white tracking-tight leading-[1.1] transition-colors duration-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            Two homes.
            <br />
            <span className="text-gray-300 dark:text-white/30 transition-colors duration-500">
              {displayed}
              <motion.span
                className="inline-block w-0.5 h-[0.85em] bg-gray-300 dark:bg-white/30 align-middle ml-0.5 translate-y-[0.05em]"
                animate={{ opacity: done ? [1, 0] : 1 }}
                transition={done ? { duration: 0.6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } : {}}
              />
            </span>
          </motion.h1>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 w-full max-w-5xl mb-16 sm:mb-20">
          <HouseCard
            house={house23}
            index={0}
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
          />
          <HouseCard
            house={house22}
            index={1}
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border border-gray-300 dark:border-white/20 flex items-start justify-center p-1.5"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-0.5 h-1.5 rounded-full bg-gray-400 dark:bg-white/40" />
        </motion.div>
      </motion.div>
    </div>
  )
}
