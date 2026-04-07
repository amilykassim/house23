"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Users, Bed, Bath } from "lucide-react"
import { motion, useScroll, useTransform } from "motion/react"
import { VelstaysBrand } from "@/components/velstays-brand"
import { useRef, useState, useEffect } from "react"
import { houses } from "@/lib/houses"
import type { HouseData } from "@/lib/houses"

interface HeroSectionProps {
  house: HouseData
}

export function HeroSection({ house }: HeroSectionProps) {
  const sectionRef = useRef(null)
  const [dynamicPrice, setDynamicPrice] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/prices")
      .then((res) => res.json())
      .then((data) => {
        if (data[house.slug]?.pricePerNight != null) {
          setDynamicPrice(data[house.slug].pricePerNight)
        }
      })
      .catch(() => {})
  }, [house.slug])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -60])

  const currentIndex = houses.findIndex((h) => h.slug === house.slug)

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen pt-16 bg-black"
    >
      {/* Background Image */}
      <div className="absolute inset-0 pt-16 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0"
          style={{ y: imageY }}
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
      </div>

      {/* Hero Content */}
      <motion.div
        className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-end pb-24 sm:pb-28 px-4 sm:px-6 lg:px-8 pointer-events-none"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="mx-auto max-w-7xl w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
            {/* Rating Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-white">{house.rating}</span>
                <span className="text-white/70 text-sm">{house.reviewCount} reviews</span>
                <span className="text-white/40">|</span>
                <span className="text-sm text-white font-medium">Superhost</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-4 text-balance">
              <span className="font-serif">Velstays</span> · <span className="relative inline-block font-brand">
                <span className="relative z-10">{house.name}</span>
                <motion.span
                  className="absolute bottom-0 left-0 right-0 h-3 rounded-full z-0 bg-white/70"
                  initial={{ scaleX: 0, rotate: 0 }}
                  animate={{ scaleX: 1, rotate: -2 }}
                  transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                  style={{ originX: 0, transformOrigin: "left center" }}
                />
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-6 max-w-2xl text-pretty leading-relaxed">
              {house.tagline}
            </p>

            {/* Location */}
            <div className="flex items-center gap-2 text-white/70 mb-6">
              <MapPin className="h-5 w-5" />
              <span className="text-base">{house.location}</span>
            </div>

            {/* Property Stats */}
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

            {/* Price */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-white">${dynamicPrice ?? house.pricePerNight}</span>
              <span className="text-white/60 text-sm">/ night</span>
            </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* House Selector Pills */}
      <div className="absolute z-30 bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-auto bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10">
        {houses.map((h, i) => (
          <Link
            key={h.slug}
            href={`/house/${h.slug}`}
            className="relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300"
            aria-label={`Go to ${h.name}`}
          >
            {i === currentIndex && (
              <motion.div
                layoutId="hero-pill-indicator"
                className="absolute inset-0 bg-white rounded-full shadow-sm"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${i === currentIndex ? "text-black" : "text-white/70 hover:text-white"}`}>
              {h.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
