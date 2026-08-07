"use client"

import { cn } from "@/lib/utils"
import { useLight } from "./light-context"

function BulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-6 h-6 fill-none stroke-current [stroke-width:1.6] [stroke-linecap:round] [stroke-linejoin:round]"
    >
      <g className="rays transition-opacity duration-500">
        <path d="M12 0.8v1.6M4.4 3.6l1.2 1.2M19.6 3.6l-1.2 1.2M1.6 10.5h1.7M20.7 10.5h1.7" />
      </g>
      <path
        className="glass transition-[fill] duration-500"
        d="M12 4a5.4 5.4 0 0 0-3.2 9.75c.62.5.98 1.2.98 1.95h4.44c0-.75.36-1.45.98-1.95A5.4 5.4 0 0 0 12 4z"
      />
      <path d="M9.9 18.4h4.2M10.7 21h2.6" />
    </svg>
  )
}

export function LampToggle({ arriving = false, className }: { arriving?: boolean; className?: string }) {
  const { lampOn, setLampOn } = useLight()

  return (
    <button
      type="button"
      onClick={() => setLampOn(!lampOn)}
      aria-pressed={lampOn}
      aria-label={lampOn ? "Turn the light off" : "Turn the light on"}
      className={cn(
        "lamp-toggle torch-only-flex flex-col items-center gap-2 cursor-pointer",
        "text-[0.72rem] font-semibold uppercase tracking-[0.18em]",
        arriving && "lamp-toggle-arriving",
        lampOn ? "text-primary" : "text-muted-foreground",
        className
      )}
    >
      <span
        className={cn(
          "lamp-bulb grid place-items-center w-[3.2rem] h-[3.2rem] rounded-full border backdrop-blur-sm bg-background/55",
          lampOn
            ? "border-primary/65 [box-shadow:0_0_26px_4px_rgba(220,166,63,0.35),inset_0_0_12px_rgba(220,166,63,0.25)] [&_.rays]:opacity-100 [&_.glass]:fill-primary/35"
            : "border-border hover:border-primary/50 [&_.rays]:opacity-0"
        )}
      >
        <BulbIcon />
      </span>
      <span>{lampOn ? "Light on" : "Light off"}</span>
    </button>
  )
}
