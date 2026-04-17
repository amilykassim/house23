"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { SkeletonImage } from "@/components/skeleton-image"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence, LayoutGroup } from "motion/react"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion"
import { SlidingHighlight } from "@/components/sliding-highlight"
import type { HousePhoto } from "@/lib/houses"

interface PhotoGalleryProps {
  photos: HousePhoto[]
  allPhotos?: HousePhoto[]
  houseName?: string
}

const CATEGORY_ORDER = [
  "Living Room",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Game Room",
  "Office",
  "Outdoor",
  "Exterior",
]

export function PhotoGallery({ photos, allPhotos, houseName = "Velstays" }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [allPhotosOpen, setAllPhotosOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const lightboxPhotos = allPhotos && allPhotos.length > 0 ? allPhotos : photos

  // Group photos by category
  const categorizedPhotos = useMemo(() => {
    const groups: Record<string, HousePhoto[]> = {}
    for (const photo of lightboxPhotos) {
      const cat = photo.category || "Other"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(photo)
    }
    // Sort categories by predefined order
    const sorted: [string, HousePhoto[]][] = []
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]) {
        sorted.push([cat, groups[cat]])
        delete groups[cat]
      }
    }
    // Append any remaining categories
    for (const [cat, photos] of Object.entries(groups)) {
      sorted.push([cat, photos])
    }
    return sorted
  }, [lightboxPhotos])

  const categoryNames = useMemo(() => categorizedPhotos.map(([name]) => name), [categorizedPhotos])

  // Track which category is in view
  useEffect(() => {
    if (!allPhotosOpen) return
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.getAttribute("data-category"))
          }
        }
      },
      { root: container, rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    )

    const timeout = setTimeout(() => {
      for (const ref of Object.values(categoryRefs.current)) {
        if (ref) observer.observe(ref)
      }
    }, 100)

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [allPhotosOpen])

  // Auto-scroll active tab into view on mobile
  const scrollActiveTabIntoView = useCallback((category: string | null) => {
    if (!category) return
    const tab = tabRefs.current[category]
    const container = tabsContainerRef.current
    if (!tab || !container) return
    const containerRect = container.getBoundingClientRect()
    const tabRect = tab.getBoundingClientRect()
    const scrollLeft = tab.offsetLeft - containerRect.width / 2 + tabRect.width / 2
    container.scrollTo({ left: scrollLeft, behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollActiveTabIntoView(activeCategory)
  }, [activeCategory, scrollActiveTabIntoView])

  const openAllPhotos = () => {
    setAllPhotosOpen(true)
    setActiveCategory(categoryNames[0] || null)
    window.history.pushState({ allPhotos: true }, "")
  }

  const closeAllPhotos = () => {
    window.history.back()
  }

  const openLightboxFromCategory = (photo: HousePhoto) => {
    const index = lightboxPhotos.findIndex((p) => p.src === photo.src)
    setCurrentIndex(index >= 0 ? index : 0)
    setLightboxOpen(true)
    window.history.pushState({ lightbox: true, allPhotos: true }, "")
  }

  const closeLightbox = () => {
    window.history.back()
  }

  // Handle browser back/forward buttons
  // Use refs to always read the latest state inside the handler
  const lightboxOpenRef = useRef(lightboxOpen)
  const allPhotosOpenRef = useRef(allPhotosOpen)
  lightboxOpenRef.current = lightboxOpen
  allPhotosOpenRef.current = allPhotosOpen

  useEffect(() => {
    const handlePopState = () => {
      if (lightboxOpenRef.current) {
        setLightboxOpen(false)
      } else if (allPhotosOpenRef.current) {
        setAllPhotosOpen(false)
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? lightboxPhotos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === lightboxPhotos.length - 1 ? 0 : prev + 1))
  }

  const scrollToCategory = (category: string) => {
    const ref = categoryRefs.current[category]
    if (ref && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top
      const elementTop = ref.getBoundingClientRect().top
      const offset = elementTop - containerTop - 72
      scrollContainerRef.current.scrollBy({ top: offset, behavior: "smooth" })
    }
    setActiveCategory(category)
  }

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious()
      else if (e.key === "ArrowRight") goToNext()
      else if (e.key === "Escape") closeLightbox()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, lightboxPhotos.length])

  // Handle escape for all photos view (only when lightbox is NOT open)
  useEffect(() => {
    if (!allPhotosOpen || lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllPhotos()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [allPhotosOpen, lightboxOpen])

  return (
    <section id="photos" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl">
        <FadeIn className="mb-12 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Explore the Space
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every corner of <SlidingHighlight delay={0.4}>{houseName}</SlidingHighlight> has been thoughtfully designed for comfort, beauty, and unforgettable moments
          </p>
        </FadeIn>

        {/* Bento Grid Gallery */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]" staggerDelay={0.08}>
          {/* Large featured image */}
          <StaggerItem className="col-span-2 row-span-2">
            <button
              onClick={openAllPhotos}
              className="relative rounded-2xl overflow-hidden group cursor-pointer w-full h-full"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full h-full"
              >
                <SkeletonImage
                  src={photos[0].src}
                  alt={photos[0].alt}
                  fill
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 pointer-events-none" />
              <span className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm text-foreground text-sm font-medium px-3 py-1.5 rounded-full">
                {photos[0].label}
              </span>
            </button>
          </StaggerItem>

          {/* Remaining images */}
          {photos.slice(1).map((photo) => (
            <StaggerItem key={photo.src}>
              <button
                onClick={openAllPhotos}
                className="relative rounded-2xl overflow-hidden group cursor-pointer w-full h-full"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="w-full h-full"
                >
                  <SkeletonImage
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 pointer-events-none" />
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
            View all {lightboxPhotos.length} photos
          </Button>
        </FadeIn>
      </div>

      {/* All Photos - Categorized View (Airbnb style) */}
      <AnimatePresence>
        {allPhotosOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Top header bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                  <button
                    onClick={closeAllPhotos}
                    className="flex items-center gap-2 text-foreground hover:text-foreground/70 transition-colors group"
                  >
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-medium text-sm">Back</span>
                  </button>
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    {houseName}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {lightboxPhotos.length} photos
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Category navigation tabs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="sticky top-16 z-10 bg-background/95 backdrop-blur-md"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div
                  ref={tabsContainerRef}
                  className="flex gap-1.5 overflow-x-auto scrollbar-hide py-3"
                >
                  <LayoutGroup>
                    {categoryNames.map((name, i) => (
                      <motion.button
                        key={name}
                        ref={(el) => { tabRefs.current[name] = el }}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
                        onClick={() => scrollToCategory(name)}
                        className={`relative shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                          activeCategory === name
                            ? "text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {activeCategory === name && (
                          <motion.span
                            layoutId="activeCategoryPill"
                            className="absolute inset-0 bg-foreground rounded-full"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{name}</span>
                      </motion.button>
                    ))}
                  </LayoutGroup>
                </div>
              </div>
            </motion.div>

            {/* Scrollable photo content */}
            <div
              ref={scrollContainerRef}
              className="overflow-y-auto overscroll-contain"
              style={{ height: "calc(100vh - 8.5rem)" }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {categorizedPhotos.map(([category, categoryPhotos], catIdx) => (
                  <motion.div
                    key={category}
                    ref={(el) => { categoryRefs.current[category] = el }}
                    data-category={category}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.35 + catIdx * 0.1,
                      duration: 0.5,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className="mb-16 last:mb-0"
                  >
                    {/* Category header */}
                    <div className="mb-6">
                      <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
                        {category}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {categoryPhotos.length} {categoryPhotos.length === 1 ? "photo" : "photos"}
                      </p>
                    </div>

                    {/* Photo grid - varied layout per category */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {categoryPhotos.map((photo, idx) => {
                        const isHero = idx === 0 && categoryPhotos.length > 2
                        return (
                          <motion.button
                            key={photo.src}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: 0.4 + catIdx * 0.1 + idx * 0.03,
                              duration: 0.4,
                              ease: [0.21, 0.47, 0.32, 0.98],
                            }}
                            onClick={() => openLightboxFromCategory(photo)}
                            className={`relative rounded-2xl overflow-hidden group cursor-pointer ${
                              isHero
                                ? "col-span-2 row-span-2 aspect-4/3"
                                : "aspect-4/3"
                            }`}
                          >
                            <Image
                              src={photo.src}
                              alt={photo.alt}
                              fill
                              sizes={isHero ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <span className="text-white text-sm font-medium">
                                {photo.label}
                              </span>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}

                {/* Bottom spacing */}
                <div className="h-8" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-60 bg-foreground/95 flex items-center justify-center"
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

            <motion.div
              key={lightboxPhotos[currentIndex].src}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="relative w-full max-w-5xl h-[80vh] mx-16"
            >
              <Image
                src={lightboxPhotos[currentIndex].src}
                alt={lightboxPhotos[currentIndex].alt}
                fill
                className="object-contain"
              />
            </motion.div>

            <button
              onClick={goToNext}
              className="absolute right-4 p-2 text-background hover:text-background/80 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-10 w-10" />
            </button>

            {/* Photo info */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
              <div className="text-background text-sm">
                {currentIndex + 1} / {lightboxPhotos.length}
              </div>
              {lightboxPhotos[currentIndex].category && (
                <div className="text-background/60 text-xs mt-1">
                  {lightboxPhotos[currentIndex].category} — {lightboxPhotos[currentIndex].label}
                </div>
              )}
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
