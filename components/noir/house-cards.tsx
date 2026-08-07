"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { houses } from "@/lib/houses"

const CARD_META: Record<string, { image: string; blurb: string }> = {
  "house-23": {
    image: "/images/EMMA9964.jpg",
    blurb:
      "The green-zone house. Panoramic views from the master bedroom, a dedicated office, dinners outside at sunset.",
  },
  "house-22": {
    image: "/images/AXX_9581.JPG",
    blurb: "The garden retreat. A game room, a private terrace, and lamplit rooms that make evenings easy.",
  },
}

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 1 },
} as const

export function HouseCards() {
  const [prices, setPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch("/api/prices")
      .then((res) => res.json())
      .then((data: Record<string, { pricePerNight: number }>) => {
        const mapped: Record<string, number> = {}
        for (const [slug, p] of Object.entries(data)) mapped[slug] = p.pricePerNight
        setPrices(mapped)
      })
      .catch(() => {})
  }, [])

  return (
    <section id="houses" className="relative z-[34] px-4 sm:px-8 pt-28 sm:pt-40">
      <motion.p
        {...fadeUp}
        className="text-[0.8rem] font-semibold uppercase tracking-[0.4em] text-primary pb-4"
      >
        03 — Choose your house
      </motion.p>

      {houses.map((house) => {
        const meta = CARD_META[house.slug]
        const price = prices[house.slug] ?? house.pricePerNight
        return (
          <motion.div key={house.slug} {...fadeUp}>
            <Link
              href={`/house/${house.slug}`}
              className="group grid md:grid-cols-[5fr_7fr] gap-6 md:gap-10 items-center border-t border-border py-9 last:border-b"
            >
              <div className="relative overflow-hidden aspect-16/10">
                <Image
                  src={meta.image}
                  alt={`${house.name} — ${house.tagline.slice(0, 40)}`}
                  fill
                  quality={75}
                  sizes="(max-width: 768px) 100vw, 42vw"
                  className="object-cover brightness-[0.8] transition-all duration-700 group-hover:brightness-100 group-hover:scale-105"
                />
              </div>
              <div>
                <p className="text-[0.8rem] font-semibold uppercase tracking-[0.4em] text-primary">
                  № {house.name.replace(/\D/g, "")} · ★ {house.rating}
                  {house.reviewCount > 10 ? ` (${house.reviewCount})` : ""}
                </p>
                <h3 className="mt-3 text-[clamp(2.4rem,5.4vw,4.6rem)] font-semibold uppercase tracking-[-0.02em] leading-[0.9]">
                  {house.name}
                </h3>
                <p className="mt-4 max-w-xl text-muted-foreground">{meta.blurb}</p>
                <div className="mt-6 flex flex-wrap items-baseline gap-x-7 gap-y-2 text-[0.92rem] font-medium text-muted-foreground">
                  <span className="text-2xl font-semibold text-primary">
                    ${price}
                    <span className="text-[0.8rem] text-muted-foreground font-medium"> /night</span>
                  </span>
                  <span>{house.guests} guests</span>
                  <span>{house.bedrooms} bedrooms</span>
                  <span>{house.bathrooms} baths</span>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </section>
  )
}
