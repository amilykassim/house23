"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const photos = [
  { src: "/images/EMMA9964.jpg", alt: "Main house", label: "House 23" },
  { src: "/images/EMMA0017.jpg", alt: "Spacious living room", label: "Living Room" },
  { src: "/images/EMMA0136.jpg", alt: "Kitchen", label: "Kitchen" },
  { src: "/images/EMMA0227.jpg", alt: "Exterior view", label: "Exterior" },
  { src: "/images/EMMA0107.jpg", alt: "Master bedroom", label: "Master Bedroom" },
]

export function PhotoGallery() {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  return (
    <section id="photos" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Explore the Space
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every corner of House 23 has been thoughtfully designed for comfort, beauty, and unforgettable moments
          </p>
        </div>

        {/* Bento Grid Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
          {/* Large featured image */}
          <button
            onClick={() => openLightbox(0)}
            className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer"
          >
            <Image
              src={photos[0].src}
              alt={photos[0].alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
            <span className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm text-foreground text-sm font-medium px-3 py-1.5 rounded-full">
              {photos[0].label}
            </span>
          </button>

          {/* Remaining images */}
          {photos.slice(1).map((photo, index) => (
            <button
              key={photo.src}
              onClick={() => openLightbox(index + 1)}
              className="relative rounded-2xl overflow-hidden group cursor-pointer"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
              <span className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                {photo.label}
              </span>
            </button>
          ))}
        </div>

        {/* Show All Photos Button */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8"
            onClick={() => openLightbox(0)}
          >
            View All Photos
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-background hover:text-background/80 transition-colors"
            aria-label="Close gallery"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={goToPrevious}
            className="absolute left-4 p-2 text-background hover:text-background/80 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          <div className="relative w-full max-w-5xl h-[80vh] mx-16">
            <Image
              src={photos[currentIndex].src}
              alt={photos[currentIndex].alt}
              fill
              className="object-contain"
            />
          </div>

          <button
            onClick={goToNext}
            className="absolute right-4 p-2 text-background hover:text-background/80 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          {/* Photo counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-background text-sm">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Thumbnail strip */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((photo, index) => (
              <button
                key={photo.src}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden transition-all ${index === currentIndex ? "ring-2 ring-background scale-110" : "opacity-60 hover:opacity-100"
                  }`}
              >
                <Image src={photo.src} alt={photo.alt} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
