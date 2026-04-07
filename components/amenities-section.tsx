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
  PawPrint,
  Luggage,
  Cigarette,
  Calendar,
  Bed,
  Sofa,
  Moon,
  Shirt,
  Trash2,
  Wine,
  Microwave,
  DoorOpen,
  Lock,
  Snowflake,
  Droplet,
  Zap,
  AlertTriangle,
  Gamepad2,
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
import { useMemo } from "react"

interface AmenitiesSectionProps {
  houseSlug?: string
}

const amenityCategories = [
  {
    name: "Bathroom",
    items: [
      { icon: Wind, label: "Hair dryer" },
      { icon: Sparkles, label: "Cleaning products" },
      { icon: Droplet, label: "Body soap" },
      { icon: Waves, label: "Bidet" },
      { icon: Flame, label: "Hot water" },
      { icon: Droplet, label: "Shower gel" },
    ],
  },
  {
    name: "Bedroom and Laundry",
    items: [
      { icon: Sparkles, label: "Essentials" },
      { icon: Bed, label: "Towels, bed sheets, soap, and toilet paper" },
      { icon: Shirt, label: "Hangers" },
      { icon: Bed, label: "Bed linens" },
      { icon: Bed, label: "Extra pillows and blankets" },
      { icon: Moon, label: "Room-darkening shades" },
      { icon: Sparkles, label: "Iron" },
      { icon: WashingMachine, label: "Drying rack for clothing" },
      { icon: Umbrella, label: "Mosquito net" },
      { icon: Shirt, label: "Clothing storage" },
    ],
  },
  {
    name: "Entertainment",
    items: [
      { icon: Tv, label: "55\" Smart TV" },
      { icon: Sparkles, label: "Books and reading material" },
    ],
  },
  {
    name: "Kitchen & Dining",
    items: [
      { icon: ChefHat, label: "Space where guests can cook their own meals" },
      { icon: Refrigerator, label: "Refrigerator" },
      { icon: Microwave, label: "Microwave" },
      { icon: ChefHat, label: "Cooking basics" },
      { icon: Flame, label: "Pots and pans, oil, salt and pepper" },
      { icon: Utensils, label: "Dishes and silverware" },
      { icon: Utensils, label: "Bowls, chopsticks, plates, cups, etc." },
      { icon: Snowflake, label: "Freezer" },
      { icon: Flame, label: "Stove" },
      { icon: Flame, label: "Oven" },
      { icon: Coffee, label: "Hot water kettle" },
      { icon: Coffee, label: "Coffee maker" },
      { icon: Wine, label: "Wine glasses" },
      { icon: Trash2, label: "Trash compactor" },
      { icon: Coffee, label: "Coffee" },
    ],
  },
  {
    name: "Family",
    items: [
      { icon: Sparkles, label: "Board games" },
    ],
  },
  {
    name: "Internet and office",
    items: [
      { icon: Wifi, label: "WiFi" },
      { icon: Mountain, label: "Dedicated workspace" },
    ],
  },
  {
    name: "Location features",
    items: [
      { icon: DoorOpen, label: "Private entrance" },
    ],
  },
  {
    name: "Outdoor",
    items: [
      { icon: TreePalm, label: "Backyard" },
      { icon: Sun, label: "An open space on the property usually covered in grass" },
    ],
  },
  {
    name: "Parking and facilities",
    items: [
      { icon: Car, label: "Free driveway parking on premises – 2 spaces" },
      { icon: Car, label: "Free street parking" },
    ],
  },
  {
    name: "Services",
    items: [
      { icon: PawPrint, label: "Pets allowed" },
      { icon: Luggage, label: "Luggage dropoff allowed" },
      { icon: Cigarette, label: "Smoking allowed outside" },
      { icon: Calendar, label: "Long term stays allowed" },
      { icon: Lock, label: "Self check-in" },
      { icon: Sparkles, label: "Housekeeping available from 7:00 AM to 6:00 PM, every day - available at extra cost" },
    ],
  },
  {
    name: "Not included",
    items: [
      { icon: WashingMachine, label: "Washer" },
      { icon: Wind, label: "Dryer" },
      { icon: Wind, label: "Air conditioning" },
      { icon: AlertTriangle, label: "Smoke alarm" },
      { icon: AlertTriangle, label: "Carbon monoxide alarm" },
      { icon: Zap, label: "Heating" },
    ],
  },
]

const baseFeaturedAmenities = [
  { icon: Wind, label: "Self check-in" },
  { icon: Mountain, label: "Dedicated workspace", house22Label: "Game Room", house22Icon: Gamepad2 },
  { icon: Car, label: "Free private parking" },
  { icon: Mountain, label: "Lush green view" },
  { icon: Wifi, label: "WiFi" },
  { icon: Utensils, label: "Kitchen" },
  { icon: Coffee, label: "Coffe machine" },
  { icon: Tv, label: "Smart TV" },
]

export function AmenitiesSection({ houseSlug = "house-23" }: AmenitiesSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const isHouse22 = houseSlug === "house-22"

  const featuredAmenities = useMemo(() => {
    return baseFeaturedAmenities.map((a) => {
      if (isHouse22 && a.house22Label) {
        return { icon: a.house22Icon || a.icon, label: a.house22Label }
      }
      return { icon: a.icon, label: a.label }
    })
  }, [isHouse22])

  const dynamicCategories = useMemo(() => {
    if (!isHouse22) return amenityCategories
    return amenityCategories.map((cat) => {
      if (cat.name === "Internet and office") {
        return {
          ...cat,
          name: "Internet and entertainment",
          items: cat.items.map((item) =>
            item.label === "Dedicated workspace"
              ? { icon: Gamepad2, label: "Game Room" }
              : item
          ),
        }
      }
      return cat
    })
  }, [isHouse22])

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
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary/10">
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
            <Button variant="outline" size="lg" className="rounded-full px-10 py-3 text-base hover:bg-transparent hover:border-foreground hover:text-foreground">
              Show all 38 amenities
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-background rounded-[30px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">What this place offers</DialogTitle>
            </DialogHeader>
            <div className="mt-6 space-y-8 bg-background overflow-y-auto max-h-[calc(80vh-100px)]">
              {dynamicCategories.map((category) => (
                <div key={category.name}>
                  <h3 className="font-semibold text-foreground mb-4">{category.name}</h3>
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-4 pb-3 border-b border-border last:border-0"
                      >
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className={`${category.name === "Not included" ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.label}</span>
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
