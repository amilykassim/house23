"use client"

import { useState } from "react"
import {
  Wifi,
  Car,
  Waves,
  Utensils,
  Tv,
  Wind,
  Coffee,
  Flame,
  Dumbbell,
  ShieldCheck,
  WashingMachine,
  Refrigerator,
  ChefHat,
  Umbrella,
  Mountain,
  Sun,
  Sparkles,
  TreePalm,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion"

const amenityCategories = [
  {
    name: "Highlights",
    items: [
      { icon: Waves, label: "Private infinity pool" },
      { icon: Mountain, label: "Ocean view" },
      { icon: TreePalm, label: "Private beach access" },
      { icon: Sun, label: "Outdoor lounge area" },
    ],
  },
  {
    name: "Kitchen & Dining",
    items: [
      { icon: Utensils, label: "Fully equipped kitchen" },
      { icon: ChefHat, label: "Professional appliances" },
      { icon: Refrigerator, label: "Large refrigerator" },
      { icon: Coffee, label: "Espresso machine" },
    ],
  },
  {
    name: "Entertainment",
    items: [
      { icon: Tv, label: "75\" Smart TV" },
      { icon: Wifi, label: "High-speed WiFi" },
      { icon: Sparkles, label: "Sonos sound system" },
      { icon: Dumbbell, label: "Home gym" },
    ],
  },
  {
    name: "Comfort",
    items: [
      { icon: Wind, label: "Central AC" },
      { icon: Flame, label: "Indoor fireplace" },
      { icon: WashingMachine, label: "Washer & dryer" },
      { icon: Umbrella, label: "Beach equipment" },
    ],
  },
  {
    name: "Safety",
    items: [
      { icon: ShieldCheck, label: "Security system" },
      { icon: Car, label: "Private parking" },
    ],
  },
]

const featuredAmenities = [
  { icon: Waves, label: "Private pool" },
  { icon: Wifi, label: "Fast WiFi" },
  { icon: Utensils, label: "Full kitchen" },
  { icon: Mountain, label: "Ocean view" },
  { icon: Wind, label: "Central AC" },
  { icon: Tv, label: "Smart TV" },
  { icon: Coffee, label: "Espresso machine" },
  { icon: Car, label: "Free parking" },
]

export function AmenitiesSection() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <section id="amenities" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            What This Place Offers
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Everything you need for the perfect getaway, thoughtfully curated for your comfort
          </p>
        </FadeIn>

        {/* Featured Amenities Grid */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" staggerDelay={0.06}>
          {featuredAmenities.map((amenity) => (
            <StaggerItem key={amenity.label}>
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-md hover:border-primary/20 transition-all duration-300">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary/10">
                  <amenity.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">{amenity.label}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Show All Amenities */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="rounded-full px-8">
              Show all 38 amenities
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">What this place offers</DialogTitle>
            </DialogHeader>
            <div className="mt-6 space-y-8">
              {amenityCategories.map((category) => (
                <div key={category.name}>
                  <h3 className="font-semibold text-foreground mb-4">{category.name}</h3>
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-4 pb-3 border-b border-border last:border-0"
                      >
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
