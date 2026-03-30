"use client"

import { MapPin, Navigation, Clock, Car } from "lucide-react"

const nearbyPlaces = [
  { name: "Velvet Boutique Hotel Beach Access", distance: "2 min walk", icon: Navigation },
  { name: "Lamane Bakery and Cafe", distance: "4 min drive", icon: Car },
  { name: "Kigali Convention Center", distance: "13 min drive", icon: Car },
  { name: "Kigali International Airport", distance: "14 min drive", icon: Car },
]

export function LocationSection() {
  return (
    <section id="location" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Where You&apos;ll Be
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">Kigali, Rwanda</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-muted h-[400px]">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1062.1763704881878!2d30.122715354221366!3d-1.987933949009095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca70024a51111%3A0xdedd2366044e8c36!2sHouse%2023!5e0!3m2!1sen!2srw!4v1774850432549!5m2!1sen!2srw"
            />
          </div>

          {/* Location Details */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground text-lg mb-3">Getting Around</h3>
              <div className="space-y-4">
                {nearbyPlaces.map((place) => (
                  <div key={place.name} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
                      <place.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{place.name}</p>
                      <p className="text-sm text-muted-foreground">{place.distance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-semibold text-foreground text-lg mb-3">About the Area</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nestled in the vibrant city of Kigali, Casamigo offers the perfect blend of
                seclusion and accessibility. Enjoy local attractions, cultural experiences, and proximity to acclaimed restaurants while staying in your own
                private paradise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
