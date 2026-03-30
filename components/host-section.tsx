"use client"

import { Shield, Star, MessageCircle, Clock, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion"

const hostStats = [
  { label: "Reviews", value: "43" },
  { label: "Rating", value: "4.95" },
  { label: "Years hosting", value: "3+" },
]

const hostHighlights = [
  { icon: Star, text: "Superhost for 3+ years" },
  { icon: Clock, text: "Responds within an hour" },
  { icon: Shield, text: "Identity verified" },
]

export function HostSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Host Info */}
          <FadeIn direction="left">
            <div>
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-black from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-semibold">
                    D
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-foreground">
                    Hosted by Deborah
                  </h2>
                  <p className="text-muted-foreground">Since 2024</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mb-8 pb-8 border-b border-border">
                {hostStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Highlights */}
              <div className="space-y-4 mb-8">
                {hostHighlights.map((highlight) => (
                  <div key={highlight.text} className="flex items-center gap-3">
                    <highlight.icon className="h-5 w-5 text-primary" />
                    <span className="text-foreground">{highlight.text}</span>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="lg" className="rounded-full px-8">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Host
              </Button>
            </div>
          </FadeIn>

          {/* About Host */}
          <FadeIn direction="right" delay={0.2}>
            <div className="bg-secondary/30 rounded-2xl p-8">
              <h3 className="font-semibold text-foreground text-lg mb-4">About Deborah</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                I&apos;m passionate about ensuring every guest has an unforgettable stay. Whether you need
                restaurant recommendations, outdoor activities, or hiking tips, I&apos;m here to help make your
                vacation perfect.
              </p>
              <div className="pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">During your stay</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  I&apos;m always available via message for any questions or assistance. For urgent matters,
                  you can reach me directly by phone. I also have a local house caretaker who can
                  assist with any on-site needs.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
