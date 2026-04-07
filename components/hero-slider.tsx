"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Users, Bed, Bath, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { VelstaysBrand } from "@/components/velstays-brand"
import type { HouseData } from "@/lib/houses"

interface HeroSliderProps {
  houses: HouseData[]
}

const AUTO_SLIDE_INTERVAL = 7000

export function HeroSlider({ houses }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = next, -1 = prev
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1)
      setCurrent(index)
    },
    [current]
  )

  const goNext = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % houses.length)
  }, [houses.length])

  const goPrev = useCallback(() => {
    setDirection(-1)
    setCurrent((prev) => (prev - 1 + houses.length) % houses.length)
  }, [houses.length])

  // Auto-slide
  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(goNext, AUTO_SLIDE_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [goNext, isPaused])

  // Reset timer on manual navigation
  const handleManual = useCallback(
    (fn: () => void) => {
      if (timerRef.current) clearInterval(timerRef.current)
      fn()
    },
    []
  )

  const house = houses[current]

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "8%" : "-8%",
      opacity: 0,
      scale: 1.04,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-8%" : "8%",
      opacity: 0,
      scale: 0.96,
    }),
  }

  const contentVariants = {
    enter: (dir: number) => ({
      y: 40,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: {
      y: -30,
      opacity: 0,
    },
  }

  return (
    <section
      className="relative min-h-screen pt-16 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images */}
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={house.slug}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0 pt-16"
        >
          <Image
            src={house.heroImage}
            alt={`${house.name} - vacation home exterior`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/70" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-end pb-24 sm:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl w-full">
          <div className="max-w-3xl">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={house.slug + "-content"}
                custom={direction}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                {/* Rating Badge */}
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 mb-5 border border-white/10">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-white">{house.rating}</span>
                  <span className="text-white/70 text-sm">{house.reviewCount} reviews</span>
                  <span className="text-white/40">|</span>
                  <span className="text-sm text-white font-medium">Superhost</span>
                </div>

                {/* Title */}
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-4  text-balance">
                  <span className="font-brand">{house.name}</span>
                </h1>
                <p className="text-lg sm:text-xl text-white/80 mb-6 max-w-2xl text-pretty leading-relaxed">
                  {house.tagline}
                </p>

                {/* Location */}
                <div className="flex items-center gap-2 text-white/70 mb-6">
                  <MapPin className="h-5 w-5" />
                  <span className="text-base">{house.location}</span>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { icon: Users, label: `${house.guests} guests` },
                    { icon: Bed, label: `${house.bedrooms} bedrooms` },
                    { icon: Bath, label: `${house.bathrooms} bathrooms` },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10"
                    >
                      <stat.icon className="h-4 w-4 text-white/70" />
                      <span className="text-sm font-medium text-white">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Price + CTA */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/house/${house.slug}`}
                    className="group inline-flex items-center gap-2 bg-white text-black font-semibold rounded-full px-8 py-3.5 text-base hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Explore {house.name}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold text-white">${house.pricePerNight}</span>
                    <span className="text-white/60 text-sm">/ night</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute z-20 right-4 sm:right-8 bottom-24 sm:bottom-28 flex items-center gap-2">
        <button
          onClick={() => handleManual(goPrev)}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all duration-300 hover:scale-105"
          aria-label="Previous house"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleManual(goNext)}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all duration-300 hover:scale-105"
          aria-label="Next house"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute z-20 bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {houses.map((h, i) => (
          <button
            key={h.slug}
            onClick={() => handleManual(() => goTo(i))}
            className="group relative p-1"
            aria-label={`Go to ${h.name}`}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === current
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/40 group-hover:bg-white/70"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Progress bar */}
      {!isPaused && (
        <div className="absolute z-20 bottom-0 left-0 right-0 h-[2px] bg-white/10">
          <motion.div
            key={current}
            className="h-full bg-white/50"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTO_SLIDE_INTERVAL / 1000, ease: "linear" }}
          />
        </div>
      )}
    </section>
  )
}
