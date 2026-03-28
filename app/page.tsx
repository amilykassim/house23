import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PhotoGallery } from "@/components/photo-gallery"
import { AmenitiesSection } from "@/components/amenities-section"
import { BookingCard } from "@/components/booking-card"
import { ReviewsSection } from "@/components/reviews-section"
import { LocationSection } from "@/components/location-section"
import { HostSection } from "@/components/host-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />

      {/* Main Content with Booking Sidebar */}
      <div className="bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Property Description */}
              <section>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                  All yours, no sharing 🤗
                </h2>
                <p className="text-muted-foreground mb-6">
                  3 guests · 2 bedrooms · 2 beds · 2 bathrooms
                </p>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-foreground leading-relaxed mb-4">
                    Welcome to House 23, This architectural masterpiece seamlessly blends indoor and
                    outdoor living, offering panoramic green zone views from the master bedroom and living room.
                  </p>
                  <p className="text-foreground leading-relaxed mb-4">
                    Step inside to discover an open-concept living space bathed in natural light,
                    featuring almost floor-to-ceiling windows, custom furnishings, and designer finishes
                    throughout. The gourmet kitchen is equipped with professional-grade appliances,
                    perfect for preparing memorable meals with locally sourced ingredients.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    Outside, your private living room overlooks the lush green surroundings, while the
                    outdoor sitting area provides the perfect setting for al fresco dining and sunset
                    cocktails. House 23 offers the ultimate Kigalian experience.
                  </p>
                </div>
              </section>

              {/* Highlights */}
              <section className="pt-8 border-t border-border">
                <div className="grid gap-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Exceptional hospitality</h3>
                      <p className="text-muted-foreground text-sm">43 guests gave the check-in process a 5-star rating.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Great location</h3>
                      <p className="text-muted-foreground text-sm">100% of recent guests gave the location a 5-star rating.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Free cancellation before April 1</h3>
                      <p className="text-muted-foreground text-sm">Get a full refund if you change your mind.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <BookingCard />
            </div>
          </div>
        </div>
      </div>

      <PhotoGallery />
      <AmenitiesSection />
      <ReviewsSection />
      <LocationSection />
      <HostSection />
      <Footer />
    </main>
  )
}
