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
import { OtherHouseBanner } from "@/components/other-house-banner"
import { SavingsBanner } from "@/components/savings-banner"
import { AnimatedHighlights } from "@/components/animated-highlights"
import { getHouseBySlug, getAllHouseSlugs, houses } from "@/lib/houses"
import { getOrderedPhotos } from "@/lib/photo-order"
import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, ChevronRight } from "lucide-react"

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

    const { photos, allPhotos } = await getOrderedPhotos(house)

    return (
        <main className="min-h-screen">
            <Header />
            <HeroSection house={house} />
            <SavingsBanner slug={house.slug} />

            {/* Main Content with Booking Sidebar */}
            <div className="relative z-20">
                {/* Gradient fade from hero into content */}
                <div className="h-40 bg-gradient-to-b from-transparent via-background/60 to-background -mt-40" />
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
                                <AnimatedHighlights highlights={house.highlights} />
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

            <PhotoGallery photos={photos} allPhotos={allPhotos} houseName={`${house.name}`} />

            {/* More from Velstays */}
            {(() => {
                const otherHouse = houses.find((h) => h.slug !== house.slug)
                return otherHouse ? (
                    <OtherHouseBanner currentSlug={house.slug} otherHouse={otherHouse} />
                ) : null
            })()}

            {/* Things to Know */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
                <div className="mx-auto max-w-7xl">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Things to know to
                        </span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-8">
                        Enjoy your stay
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                href: "/house-guide",
                                title: "Wifi details, TV...",
                                description: "How to use the Wi-Fi, TV, oven and more — your complete manual.",
                            },
                            {
                                href: "/check-in-check-out",
                                title: "Check-in & Check-out",
                                description: "Everything about your arrival, departure, and what to expect.",
                            },
                            {
                                href: "/house-rules",
                                title: "House Rules",
                                description: "A few simple guidelines to keep the space great for everyone.",
                            },
                            {
                                href: "/cancellation-policy",
                                title: "Cancellation Policy",
                                description: "Plans change — see our flexible cancellation options.",
                            },
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group relative flex flex-col justify-between rounded-2xl border border-border p-6 transition-all hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm"
                            >
                                <div>
                                    <h4 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                                        {item.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 mt-4 text-primary transition-transform duration-200 group-hover:translate-x-1">
                                    <span className="text-sm font-medium">Read</span>
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <AmenitiesSection houseSlug={house.slug} />
            <ReviewsSection />
            <LocationSection house={house} />
            <HostSection />
            <Footer />
        </main>
    )
}
