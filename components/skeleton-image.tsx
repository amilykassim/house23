"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface SkeletonImageProps extends ImageProps {
  skeletonClassName?: string
}

/**
 * A wrapper around next/image that shows an animated shimmer skeleton
 * while the image loads. Gracefully fades in the image once ready.
 */
export function SkeletonImage({
  className,
  skeletonClassName,
  onLoad,
  ...props
}: SkeletonImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {/* Skeleton shimmer — visible until image loads */}
      {!loaded && (
        <div
          className={cn(
            "absolute inset-0 bg-muted/80 animate-pulse",
            skeletonClassName
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent skeleton-shimmer" />
        </div>
      )}
      <Image
        {...props}
        className={cn(
          className,
          "transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={(e) => {
          setLoaded(true)
          if (typeof onLoad === "function") {
            ;(onLoad as (e: React.SyntheticEvent<HTMLImageElement>) => void)(e)
          }
        }}
      />
    </>
  )
}
