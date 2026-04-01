"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion"
import type { HousePhoto } from "@/lib/houses"

interface PhotoGalleryProps {
  photos: HousePhoto[]
  allPhotos?: HousePhoto[]
  houseName?: string
}

export function PhotoGallery({ photos, allPhotos, houseName = "House by AD" }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(false)

  const lightboxPhotos = allPhotos && allPhotos.length > 0 ? allPhotos : photos

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const openAllPhotos = () => {
    setCurrentIndex(0)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? lightboxPhotos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === lightboxPhotos.length - 1 ? 0 : prev + 1))
  }

  return (
    <section id="photos" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-12 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Explore the Space
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every corner of {houseName} has been thoughtfully designed for comfort, beauty, and unforgettable moments
          </p>
        </FadeIn>

        {/* Bento Grid Gallery */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]" staggerDelay={0.08}>
          {/* Large featured image */}
          <StaggerItem className="col-span-2 row-span-2">
            <button
              onClick={() => openLightbox(0)}
              className="relative rounded-2xl overflow-hidden group cursor-pointer w-full h-full"
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
          </StaggerItem>

          {/* Remaining images */}
          {photos.slice(1).map((photo, index) => (
            <StaggerItem key={photo.src}>
              <button
                onClick={() => openLightbox(index + 1)}
                className="relative rounded-2xl overflow-hidden group cursor-pointer w-full h-full"
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
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Show All Photos Button */}
        <FadeIn delay={0.3} className="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 hover:bg-transparent hover:border-foreground hover:text-foreground"
            onClick={openAllPhotos}
          >
            View All Photos
          </Button>
        </FadeIn>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-foreground/95 flex items-center justify-center"
          >
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
                src={lightboxPhotos[currentIndex].src}
                alt={lightboxPhotos[currentIndex].alt}
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
              {currentIndex + 1} / {lightboxPhotos.length}
            </div>

            {/* Thumbnail strip */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-4 scrollbar-hide">
              {lightboxPhotos.map((photo, index) => (
                <button
                  key={photo.src}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden transition-all shrink-0 ${index === currentIndex ? "ring-2 ring-background scale-110" : "opacity-60 hover:opacity-100"
                    }`}
                >
                  <Image src={photo.src} alt={photo.alt} fill className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
