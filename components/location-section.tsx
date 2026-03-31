"use client"

import { MapPin, Navigation, Clock, Car } from "lucide-react"
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from "@/components/motion"
import type { HouseData } from "@/lib/houses"

interface LocationSectionProps {
  house: HouseData
}

export function LocationSection({ house }: LocationSectionProps) {
  return (
    <section id="location" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Where You&apos;ll Be
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">{house.location}</span>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map */}
          <ScaleIn className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden bg-muted h-100">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={house.mapEmbed}
              />
            </div>
          </ScaleIn>

          {/* Location Details */}
          <FadeIn direction="right" delay={0.2}>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-3">Getting Around</h3>
                <div className="space-y-4">
                  {house.nearbyPlaces.map((place) => {
                    const Icon = place.type === "walk" ? Navigation : Car
                    return (
                      <div key={place.name} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{place.name}</p>
                          <p className="text-sm text-muted-foreground">{place.distance}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
