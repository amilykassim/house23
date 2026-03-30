"use client"

import Image from "next/image"
import { Star, MapPin, Users, Bed, Bath } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import type { HouseData } from "@/lib/houses"

interface HeroSectionProps {
  house: HouseData
}

export function HeroSection({ house }: HeroSectionProps) {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -50])

  return (
    <section ref={sectionRef} className="relative min-h-screen pt-16">
      {/* Hero Image with Parallax */}
      <motion.div className="absolute inset-0 pt-16" style={{ y: imageY }}>
        <Image
          src={house.heroImage}
          alt={`${house.name} - Luxury vacation home exterior`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
      </motion.div>

      {/* Hero Content */}
      <motion.div
        className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="mx-auto max-w-7xl w-full">
          <div className="max-w-3xl">
            {/* Rating Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="inline-flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
            >
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-semibold text-foreground">{house.rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">{house.reviewCount} reviews</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-foreground font-medium">Superhost</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-card leading-tight mb-4 drop-shadow-lg text-balance"
            >
              {house.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="text-lg sm:text-xl text-card mb-6 max-w-2xl drop-shadow-lg text-pretty"
            >
              {house.tagline}
            </motion.p>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex items-center gap-2 text-card mb-8"
            >
              <MapPin className="h-5 w-5" />
              <span className="text-base">{house.location}</span>
            </motion.div>

            {/* Property Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex flex-wrap gap-6 mb-8"
            >
              <div className="flex items-center gap-2 bg-background/90 backdrop-blur-smreen-989800black rounded-full px-4 py-2">
                <Users className="h-4 w-4 text-muted-foregroundhitereengb" />
                <span className="text-sm font-medium text-foreground">{house.guests} guests</span>
              </div>
              <div className="flex items-center gap-2 bg-background/90 backdrop-blur898-sblackm rounded-full px-4 py-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{house.bedrooms} bedrooms</span>
              </div>
              <div className="flex items-center gap-2 bg-background/90 backdrop-blur898-sblackm rounded-full px-4 py-2">
                <Bath className="h-4 w-4 text-muted-foregroundhite" />
                <span className="text-sm font-medium text-foreground">{house.bathrooms} bathrooms</span>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex flex-wrap gap-4"
            >
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
