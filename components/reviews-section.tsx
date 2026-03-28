"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const ratingCategories = [
  { label: "Cleanliness", score: 5.0 },
  { label: "Accuracy", score: 4.9 },
  { label: "Check-in", score: 5.0 },
  { label: "Communication", score: 5.0 },
  { label: "Location", score: 4.9 },
  { label: "Value", score: 4.8 },
]

const reviews = [
  {
    id: 1,
    name: "Sarah M.",
    avatar: "SM",
    location: "San Francisco, CA",
    date: "March 2026",
    rating: 5,
    text: "Absolutely stunning property! The ocean views are even better than the photos. We loved waking up to the sound of waves and having coffee by the infinity pool. The kitchen is a dream for anyone who loves to cook.",
  },
  {
    id: 2,
    name: "James & Emily",
    avatar: "JE",
    location: "Austin, TX",
    date: "February 2026",
    rating: 5,
    text: "Our family had the most amazing vacation here. The kids loved the pool, and we enjoyed the private beach access. Everything was immaculately clean and exactly as described. Will definitely be back!",
  },
  {
    id: 3,
    name: "Michael R.",
    avatar: "MR",
    location: "New York, NY",
    date: "February 2026",
    rating: 5,
    text: "Perfect getaway spot. The host was incredibly responsive and provided excellent recommendations for local restaurants. The sunset views from the deck are simply magical. Five stars all around!",
  },
  {
    id: 4,
    name: "Lisa T.",
    avatar: "LT",
    location: "Seattle, WA",
    date: "January 2026",
    rating: 5,
    text: "We celebrated our anniversary here and it exceeded all expectations. The attention to detail, from the welcome basket to the high-end amenities, made us feel truly special. A luxurious yet comfortable retreat.",
  },
  {
    id: 5,
    name: "David & Kate",
    avatar: "DK",
    location: "Chicago, IL",
    date: "January 2026",
    rating: 5,
    text: "This is hands down the best Airbnb we have ever stayed at. The property is stunning, the location is perfect, and the host goes above and beyond. Already planning our next trip!",
  },
  {
    id: 6,
    name: "Amanda P.",
    avatar: "AP",
    location: "Denver, CO",
    date: "December 2025",
    rating: 5,
    text: "Incredible property with breathtaking views. The house is beautifully designed and has everything you could need. The private pool was the highlight for us. Highly recommend for a special occasion!",
  },
]

function RatingBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full"
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium text-foreground w-8">{score.toFixed(1)}</span>
    </div>
  )
}

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {review.avatar}
        </div>
        <div>
          <p className="font-semibold text-foreground">{review.name}</p>
          <p className="text-sm text-muted-foreground">{review.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[...Array(review.rating)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-foreground text-foreground" />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{review.date}</span>
      </div>
      <p className="text-foreground leading-relaxed">{review.text}</p>
    </div>
  )
}

export function ReviewsSection() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl">
        {/* Rating Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 fill-foreground text-foreground" />
            <span className="font-serif text-4xl font-semibold text-foreground">4.95</span>
          </div>
          <div className="h-8 w-px bg-border hidden md:block" />
          <p className="text-lg text-foreground">
            <span className="font-semibold">43 reviews</span> from verified guests
          </p>
        </div>

        {/* Rating Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12 pb-12 border-b border-border">
          {ratingCategories.map((category) => (
            <div key={category.label}>
              <p className="text-sm text-muted-foreground mb-2">{category.label}</p>
              <RatingBar score={category.score} />
            </div>
          ))}
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 mb-10">
          {reviews.slice(0, 6).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Show All Reviews */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="rounded-full px-8">
              Show all 42 reviews
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl flex items-center gap-3">
                <Star className="h-6 w-6 fill-foreground text-foreground" />
                4.95 · 42 reviews
              </DialogTitle>
            </DialogHeader>
            <div className="mt-6 space-y-8">
              {reviews.map((review) => (
                <div key={review.id} className="pb-8 border-b border-border last:border-0">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
