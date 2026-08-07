"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WallPhoto {
  src: string
  alt: string
  house: string
  caption: string
  /** tile aspect ratio, e.g. "4/3" — varied per tile so the wall reads as a mosaic */
  ratio: string
}

export function PhotoWall({ photos }: { photos: WallPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null)

  const step = useCallback(
    (dir: number) => {
      setOpen((cur) => (cur === null ? cur : (cur + dir + photos.length) % photos.length))
    },
    [photos.length]
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
      if (e.key === "ArrowLeft") step(-1)
      if (e.key === "ArrowRight") step(1)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, step])

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 px-4 sm:px-8">
        {photos.map((photo, i) => (
          <motion.button
            key={photo.src}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`View photo: ${photo.caption}`}
            className="group relative block w-full overflow-hidden mb-2.5 break-inside-avoid cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.9 }}
          >
            <div className="relative w-full" style={{ aspectRatio: photo.ratio }}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                quality={70}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover brightness-[0.86] transition-all duration-500 group-hover:brightness-105 group-hover:scale-[1.035]"
              />
            </div>
            <span
              className={cn(
                "absolute left-3.5 bottom-3 z-[2] rounded-full px-3.5 py-1.5 backdrop-blur-sm bg-black/55",
                "text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-foreground/90",
                "opacity-0 translate-y-1.5 transition-all duration-400 group-hover:opacity-100 group-hover:translate-y-0",
                "max-[760px]:opacity-100 max-[760px]:translate-y-0"
              )}
            >
              {photo.caption}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center px-4 sm:px-14 py-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(null)
            }}
          >
            <div className="relative w-full max-w-5xl h-[74vh]">
              <Image
                src={photos[open].src}
                alt={photos[open].alt}
                fill
                quality={85}
                sizes="92vw"
                className="object-contain"
              />
            </div>
            <p className="mt-5 text-[0.85rem] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              <span className="text-primary mr-3">{photos[open].house}</span>
              {photos[open].caption}
            </p>

            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(null)}
              className="absolute top-5 right-6 grid place-items-center w-10 h-10 rounded-full border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => step(-1)}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 grid place-items-center w-12 h-12 rounded-full border border-border bg-background/60 text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => step(1)}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 grid place-items-center w-12 h-12 rounded-full border border-border bg-background/60 text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
