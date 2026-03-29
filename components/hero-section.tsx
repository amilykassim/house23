"use client"

import Image from "next/image"
import { Star, MapPin, Users, Bed, Bath } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-16">
      {/* Hero Image */}
      <div className="absolute inset-0 pt-16">
        <Image
          src="/images/EMMA9964.jpg"
          alt="House 23 - Luxury vacation home exterior"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl w-full">
          <div className="max-w-3xl">
            {/* Rating Badge */}
            <div className="inline-flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-semibold text-foreground">4.95</span>
              </div>
              <span className="text-muted-foreground text-sm">42 reviews</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-foreground font-medium">Superhost</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-card leading-tight mb-4 drop-shadow-lg text-balance">
              House 23
            </h1>
            <p className="text-lg sm:text-xl text-card/90 mb-6 max-w-2xl drop-shadow-md text-pretty">
              Designed for privacy, calm and peace. Wake up to birdsong, enjoy morning walks or jogs in our safe neighborhood, and unwind in a space that feels like peace. 🌴
            </p>

            {/* Location */}
            <div className="flex items-center gap-2 text-card/90 mb-8">
              <MapPin className="h-5 w-5" />
              <span className="text-base">Kicukiro - Kigali, Rwanda</span>
            </div>

            {/* Property Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">8 guests</span>
              </div>
              <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">4 bedrooms</span>
              </div>
              <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">3 bathrooms</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full px-8 text-base">
                Check Availability
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base bg-background/80 backdrop-blur-sm">
                View Photos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
