import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PhotoGallery } from "@/components/photo-gallery"
import { AmenitiesSection } from "@/components/amenities-section"
import { BookingCard } from "@/components/booking-card"
import { ReviewsSection } from "@/components/reviews-section"
import { LocationSection } from "@/components/location-section"
import { HostSection } from "@/components/host-section"
import { Footer } from "@/components/footer"
import { getHouseBySlug, getAllHouseSlugs } from "@/lib/houses"
import type { Metadata } from "next"

interface HousePageProps {
    params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
    return getAllHouseSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: HousePageProps): Promise<Metadata> {
    const { slug } = await params
    const house = getHouseBySlug(slug)
    if (!house) return { title: "House Not Found" }
    return {
        title: `Velstays - Vacation Home in Kigali`,
        description: house.tagline,
        icons: {
            icon: [
                {
                    url: '/icon-light-32x32.png',
                    media: '(prefers-color-scheme: light)',
                },
                {
                    url: '/icon-dark-32x32.png',
                    media: '(prefers-color-scheme: dark)',
                },
                {
                    url: '/icon.svg',
                    type: 'image/svg+xml',
                },
            ],
            apple: '/apple-icon.png',
        },
    }
}

export default async function HousePage({ params }: HousePageProps) {
    const { slug } = await params
    const house = getHouseBySlug(slug)

    if (!house) {
        notFound()
    }

    return (
        <main className="min-h-screen">
            <Header />
            <HeroSection house={house} />

            {/* Main Content with Booking Sidebar */}
            <div className="relative z-10">
                {/* Gradient fade from hero into content */}
                <div className="h-24 bg-linear-to-b from-transparent to-background -mt-24" />
                <div className="bg-background">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid lg:grid-cols-3 gap-12">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-12">
                                {/* Property Description */}
                                <section>
                                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                                        Entire place for yourself 🤗
                                    </h2>
                                    <p className="text-muted-foreground mb-6">
                                        {house.guests} guests · {house.bedrooms} bedrooms · {house.beds} beds · {house.bathrooms} bathrooms
                                    </p>
                                    <div className="prose prose-neutral max-w-none">
                                        {house.description.map((paragraph, i) => (
                                            <p key={i} className="text-foreground leading-relaxed mb-4 last:mb-0">
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                </section>

                                {/* Highlights */}
                                <section className="pt-8 border-t border-border">
                                    <div className="grid gap-6">
                                        {house.highlights.map((highlight) => (
                                            <div key={highlight.title} className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                                                    {highlight.icon === "sparkle" && (
                                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                        </svg>
                                                    )}
                                                    {highlight.icon === "location" && (
                                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    )}
                                                    {highlight.icon === "calendar" && (
                                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                    {highlight.icon === "lock" && (
                                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground">{highlight.title}</h3>
                                                    <p className="text-muted-foreground text-sm">{highlight.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Booking Sidebar */}
                            <div id="booking" className="lg:col-span-1">
                                <BookingCard
                                    pricePerNight={house.pricePerNight}
                                    cleaningFee={house.cleaningFee}
                                    serviceFee={house.serviceFee}
                                    rating={house.rating}
                                    reviewCount={house.reviewCount}
                                    maxGuests={house.guests}
                                    houseName={house.name}
                                    slug={house.slug}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PhotoGallery photos={house.photos} allPhotos={house.allPhotos} houseName={`${house.name}`} />
            <AmenitiesSection />
            <ReviewsSection />
            <LocationSection house={house} />
            <HostSection />
            <Footer />
        </main>
    )
}
