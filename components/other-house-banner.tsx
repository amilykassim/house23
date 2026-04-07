"use client"

import Link from "next/link"
import { ArrowRight, BedDouble, Bath, Users, Star } from "lucide-react"
import { SkeletonImage } from "@/components/skeleton-image"
import { FadeIn } from "@/components/motion"
import { SlidingHighlight } from "@/components/sliding-highlight"
import type { HouseData } from "@/lib/houses"

interface OtherHouseBannerProps {
  currentSlug: string
  otherHouse: HouseData
}

export function OtherHouseBanner({ currentSlug, otherHouse }: OtherHouseBannerProps) {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      {/* Subtle top divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl">
        <FadeIn direction="up">
          <p className="text-center text-sm font-medium tracking-widest uppercase text-muted-foreground mb-3">
            More from <SlidingHighlight delay={0.3}>Velstays</SlidingHighlight>
          </p>
          <h2 className="font-serif text-center text-3xl sm:text-4xl font-semibold text-foreground mb-12">
            Discover our other home
          </h2>
        </FadeIn>

        <FadeIn direction="up" delay={0.15}>
          <Link
            href={`/house/${otherHouse.slug}`}
            className="group block"
          >
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-[0_2px_20px_-6px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15),0_8px_20px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.03)] dark:hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5),0_8px_20px_-8px_rgba(0,0,0,0.4)] transition-shadow duration-500">
              <div className="grid md:grid-cols-2">
                {/* Image side */}
                <div className="relative aspect-4/3 md:aspect-auto md:min-h-85 overflow-hidden">
                  <SkeletonImage
                    src={otherHouse.heroImage}
                    alt={otherHouse.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Gradient overlay for text readability on mobile */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent md:bg-linear-to-r md:from-transparent md:via-transparent md:to-black/10" />

                  {/* Rating badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">{otherHouse.rating}</span>
                    <span className="text-xs text-muted-foreground">({otherHouse.reviewCount})</span>
                  </div>
                </div>

                {/* Content side */}
                <div className="flex flex-col justify-center p-8 sm:p-10 md:p-12">
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-brand text-2xl sm:text-3xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {otherHouse.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{otherHouse.location}</p>
                    </div>

                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {otherHouse.tagline}
                    </p>

                    {/* Property stats */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {otherHouse.guests} guests
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="h-4 w-4" />
                        {otherHouse.bedrooms} bedrooms
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Bath className="h-4 w-4" />
                        {otherHouse.bathrooms} baths
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div>
                        <span className="text-2xl font-semibold text-foreground">${otherHouse.pricePerNight}</span>
                        <span className="text-muted-foreground text-sm"> / night</span>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all duration-300">
                        Explore
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}
