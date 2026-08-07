"use client"

import { cn } from "@/lib/utils"
import { LampToggle } from "./lamp-toggle"
import { useLight } from "./light-context"

/** Corner lamp: hidden during the hero story, then rises in with a flare to take over. */
export function FloatLamp() {
  const { storyDone } = useLight()

  return (
    <div
      className={cn(
        "torch-only fixed z-[60] right-4 sm:right-8 bottom-4 sm:bottom-7",
        "transition-all duration-700 [transition-timing-function:cubic-bezier(0.65,0.05,0.36,1)]",
        storyDone
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-10 scale-75 pointer-events-none"
      )}
    >
      <LampToggle arriving={storyDone} />
    </div>
  )
}
