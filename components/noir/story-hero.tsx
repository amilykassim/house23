"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "motion/react"
import { cn } from "@/lib/utils"
import { useLight } from "./light-context"
import { LampToggle } from "./lamp-toggle"

interface Scene {
  src: string
  alt: string
  time: string
  line: React.ReactNode
}

const SCENES: Scene[] = [
  {
    src: "/images/AXX_9898.JPG",
    alt: "A bedside lamp glowing in the dark",
    time: "19:47 — Kicukiro",
    line: (
      <>
        You arrive <em className="not-italic text-primary">after dark.</em>
      </>
    ),
  },
  {
    src: "/images/EMMA9959.jpg",
    alt: "The private entrance of House 23",
    time: "19:52 — The entrance",
    line: (
      <>
        The gate closes. Kigali goes <em className="not-italic text-primary">quiet.</em>
      </>
    ),
  },
  {
    src: "/images/EMMA0125.JPG",
    alt: "The house glowing warm at night",
    time: "20:04 — Inside",
    line: (
      <>
        The lights are already on. The house was{" "}
        <em className="not-italic text-primary">expecting you.</em>
      </>
    ),
  },
  {
    src: "/images/EMMA0017.jpg",
    alt: "Morning light through glass walls",
    time: "06:38 — Morning",
    line: (
      <>
        Light comes in through <em className="not-italic text-primary">glass walls,</em> birdsong
        comes with it.
      </>
    ),
  },
  {
    src: "/images/EMMA9952.JPG",
    alt: "The private garden in daylight",
    time: "08:15 — The garden",
    line: (
      <>
        And all of this is <em className="not-italic text-primary">yours</em> until checkout.
      </>
    ),
  },
]

const N = SCENES.length

function StoryScene({
  scene,
  index,
  progress,
  lampOn,
}: {
  scene: Scene
  index: number
  progress: MotionValue<number>
  lampOn: boolean
}) {
  const at = (i: number) => i / (N - 1)
  const opacity = useTransform(progress, [at(index - 1), at(index), at(index + 1)], [0, 1, 0], {
    clamp: true,
  })
  const textOpacity = useTransform(
    progress,
    [at(index) - 0.66 / (N - 1), at(index), at(index) + 0.66 / (N - 1)],
    [0, 1, 0],
    { clamp: true }
  )
  const textY = useTransform(
    progress,
    [at(index - 1), at(index), at(index + 1)],
    [24, 0, 0],
    { clamp: true }
  )
  const scale = useTransform(
    progress,
    [at(index - 1), at(index), at(index + 1)],
    [1.12, 1.045, 1.12],
    { clamp: true }
  )
  const zIndex = useTransform(opacity, (o) => (o > 0 ? 2 : 1))

  const isFirst = index === 0

  return (
    <motion.div className="absolute inset-0" style={{ opacity, zIndex }}>
      <motion.div className="absolute inset-0" style={{ scale }}>
        <Image
          src={scene.src}
          alt={scene.alt}
          fill
          priority={isFirst}
          quality={78}
          sizes="100vw"
          className={cn(
            "object-cover transition-[filter] duration-700",
            lampOn ? "brightness-[0.78]" : "brightness-[0.62]"
          )}
        />
      </motion.div>
      <div className="absolute inset-0 [background:radial-gradient(95%_75%_at_50%_50%,transparent_30%,rgba(8,8,10,0.75)_100%)]" />
      <motion.div
        className="absolute inset-0 z-[5] flex flex-col items-center justify-center text-center px-6"
        style={{ opacity: textOpacity, y: textY }}
      >
        <motion.p
          className="text-[0.8rem] font-semibold uppercase tracking-[0.4em] text-primary mb-6"
          initial={isFirst ? { opacity: 0 } : false}
          animate={isFirst ? { opacity: 1 } : undefined}
          transition={{ delay: 0.4, duration: 1.4 }}
        >
          {scene.time}
        </motion.p>
        <motion.h2
          className="text-[clamp(2rem,5.6vw,5rem)] font-medium tracking-[-0.024em] leading-[1.04] max-w-[18ch] text-balance [text-shadow:0_2px_30px_rgba(0,0,0,0.55)]"
          initial={isFirst ? { opacity: 0, filter: "blur(14px)", scale: 1.06 } : false}
          animate={isFirst ? { opacity: 1, filter: "blur(0px)", scale: 1 } : undefined}
          transition={{ delay: 0.8, duration: 1.8 }}
        >
          {scene.line}
        </motion.h2>
      </motion.div>
    </motion.div>
  )
}

export function StoryHero() {
  const { lampOn, storyDone, setStoryDone } = useLight()
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 })
  const railScale = useTransform(progress, [0, 1], [0, 1])
  const cueOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0])

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.round(v * (N - 1)))
    setStoryDone(v >= 0.999)
  })

  if (reduced) {
    // No pinned scroll theatre for reduced motion — the scenes stack as stills.
    return (
      <div>
        {SCENES.map((scene) => (
          <div key={scene.src} className="relative h-[72vh]">
            <Image src={scene.src} alt={scene.alt} fill quality={78} sizes="100vw" className="object-cover brightness-[0.62]" />
            <div className="absolute inset-0 [background:radial-gradient(95%_75%_at_50%_50%,transparent_30%,rgba(8,8,10,0.75)_100%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <p className="text-[0.8rem] font-semibold uppercase tracking-[0.4em] text-primary mb-6">{scene.time}</p>
              <h2 className="text-[clamp(2rem,5.6vw,5rem)] font-medium tracking-[-0.024em] leading-[1.04] max-w-[18ch] text-balance">
                {scene.line}
              </h2>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div ref={ref} className="relative h-[560vh] z-[1] bg-background">
        <div className="sticky top-0 h-svh overflow-hidden">
          {SCENES.map((scene, i) => (
            <StoryScene key={scene.src} scene={scene} index={i} progress={progress} lampOn={lampOn} />
          ))}

          {/* scene counter + progress rail */}
          <div className="absolute z-10 right-6 sm:right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <span className="text-[0.78rem] font-semibold tracking-[0.14em] text-muted-foreground [writing-mode:vertical-rl] tabular-nums">
              {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
            </span>
            <span className="w-0.5 h-36 rounded-full bg-foreground/20 relative overflow-hidden">
              <motion.i
                className="absolute inset-0 bg-primary origin-top"
                style={{ scaleY: railScale }}
              />
            </span>
          </div>

          {/* scroll cue */}
          <motion.div
            className="absolute z-10 left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-3 text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-foreground/65"
            style={{ opacity: cueOpacity }}
          >
            Scroll
            <i className="cue-drip block w-px h-9 bg-foreground/40 relative overflow-hidden" />
          </motion.div>
        </div>
      </div>

      {/* hero lamp — fixed above the torch layer, anchored under the scene words;
          hands off to the corner lamp when the story is over */}
      <motion.div
        className={cn(
          "torch-only fixed z-[60] left-1/2 -translate-x-1/2 top-[calc(50%+clamp(6rem,16vh,9.5rem))]",
          storyDone && "pointer-events-none"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: storyDone ? 0 : 1 }}
        transition={{ duration: storyDone ? 0.4 : 1.2, delay: storyDone ? 0 : 1.6 }}
      >
        <LampToggle />
      </motion.div>
    </>
  )
}
