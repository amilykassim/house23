"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ReadingNavigation } from "@/components/reading-navigation"
import { GuideAccessModal } from "@/components/guide-access-modal"
import { FadeIn, ScaleIn } from "@/components/motion"
import { useState, useRef, useEffect, useCallback, type ReactNode } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react"
import {
    Wifi,
    Tv,
    CookingPot,
    Lightbulb,
    AirVent,
    ShowerHead,
    Coffee,
    Sparkles,
    Copy,
    Check,
    Zap,
    Eye,
    Flame,
    Wind,
    Droplets,
    Sun,
    Moon,
    Power,
    Volume2,
    CircleDot,
    Lock,
    Microwave,
    ChefHat,
    Bed,
    Bath,
    Sofa,
    Settings,
    CheckCircle2,
    ArrowRight,
    MessageCircle,
} from "lucide-react"

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TYPES                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface GuideStep {
    label: string
    detail: string
    icon?: ReactNode
}

interface ApplianceItem {
    id: string
    icon: ReactNode
    emoji: string
    title: string
    subtitle: string
    color: string
    bgColor: string
    steps: GuideStep[]
    tip?: string
}

interface RoomZone {
    id: string
    label: string
    icon: ReactNode
    emoji: string
    gradient: string
    description: string
    items: ApplianceItem[]
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COPY BUTTON                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all duration-200 active:scale-95 backdrop-blur-sm"
        >
            <AnimatePresence mode="wait">
                {copied ? (
                    <motion.span key="y" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Copied!
                    </motion.span>
                ) : (
                    <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1">
                        <Copy className="h-3.5 w-3.5" /> Copy password
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  STEP CARD — interactive stepper with next/back/got-it flow                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function colorToBg(color: string) {
    if (color.includes("blue")) return "bg-blue-500"
    if (color.includes("orange")) return "bg-orange-500"
    if (color.includes("red")) return "bg-red-500"
    if (color.includes("purple")) return "bg-purple-500"
    if (color.includes("cyan")) return "bg-cyan-500"
    if (color.includes("teal")) return "bg-teal-500"
    if (color.includes("amber")) return "bg-amber-500"
    if (color.includes("yellow")) return "bg-yellow-500"
    return "bg-emerald-500"
}
function colorToHoverBg(color: string) {
    if (color.includes("blue")) return "hover:bg-blue-600"
    if (color.includes("orange")) return "hover:bg-orange-600"
    if (color.includes("red")) return "hover:bg-red-600"
    if (color.includes("purple")) return "hover:bg-purple-600"
    if (color.includes("cyan")) return "hover:bg-cyan-600"
    if (color.includes("teal")) return "hover:bg-teal-600"
    if (color.includes("amber")) return "hover:bg-amber-600"
    if (color.includes("yellow")) return "hover:bg-yellow-600"
    return "hover:bg-emerald-600"
}

function StepCard({ item, onComplete, completed }: { item: ApplianceItem; onComplete: () => void; completed: boolean }) {
    const [active, setActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    const totalSteps = item.steps.length

    return (
        <motion.div
            layout
            style={{
                boxShadow: active
                    ? "0 4px 24px -4px rgba(0,0,0,0.08), 0 1px 4px -1px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)"
                    : "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)",
            }}
            whileHover={!active ? { boxShadow: "0 8px 32px -8px rgba(0,0,0,0.10), 0 2px 8px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)" } : undefined}
            className={`group relative rounded-3xl border bg-card overflow-hidden transition-all duration-500 ${active ? "border-border/60 ring-1 ring-primary/10" : "border-border/40 hover:border-border/60"}`}
        >
            {/* Header — always visible */}
            <button
                onClick={() => {
                    setActive(!active)
                    if (!active) setCurrentStep(0)
                }}
                className="w-full text-left p-5 sm:p-6 flex items-center gap-4"
            >
                <motion.div
                    className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.bgColor} flex items-center justify-center`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {item.icon}
                    {completed && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                        >
                            <Check className="h-3 w-3 text-white" />
                        </motion.div>
                    )}
                </motion.div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">{item.title}</h3>
                        <span className="text-lg shrink-0">{item.emoji}</span>
                    </div>
                    <p className="text-muted-foreground text-sm truncate">{item.subtitle}</p>
                </div>
                <motion.div
                    animate={{ rotate: active ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                    <span className="text-muted-foreground text-lg font-light select-none">+</span>
                </motion.div>
            </button>

            {/* Expanded content — stepper UI */}
            <AnimatePresence initial={false}>
                {active && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 sm:px-6 pb-6">
                            {/* Progress bar */}
                            <div className="flex items-center gap-1.5 mb-6">
                                {item.steps.map((_, i) => (
                                    <motion.div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-muted">
                                        <motion.div
                                            className={`h-full rounded-full ${colorToBg(item.color)}`}
                                            initial={{ width: "0%" }}
                                            animate={{ width: i <= currentStep ? "100%" : "0%" }}
                                            transition={{ duration: 0.3, delay: i <= currentStep ? 0.1 : 0 }}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Current step display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25 }}
                                    className="min-h-30 flex flex-col"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`shrink-0 w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                                            {item.steps[currentStep].icon || (
                                                <span className={`text-sm font-bold ${item.color}`}>{currentStep + 1}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                                Step {currentStep + 1} of {totalSteps}
                                            </p>
                                            <h4 className="font-semibold text-foreground text-lg mb-1">
                                                {item.steps[currentStep].label}
                                            </h4>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {item.steps[currentStep].detail}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation buttons */}
                            <div className="flex items-center justify-between mt-4">
                                <button
                                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                    disabled={currentStep === 0}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Back
                                </button>

                                {currentStep < totalSteps - 1 ? (
                                    <button
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all active:scale-95 flex items-center gap-2 ${colorToBg(item.color)} ${colorToHoverBg(item.color)}`}
                                    >
                                        Next <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            onComplete()
                                            setActive(false)
                                        }}
                                        className="px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-sm font-medium text-white transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Got it!
                                    </button>
                                )}
                            </div>

                            {/* Pro tip */}
                            {item.tip && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className={`mt-5 flex items-start gap-3 p-4 rounded-2xl ${item.bgColor} border border-border/50`}
                                >
                                    <Sparkles className={`h-4 w-4 shrink-0 mt-0.5 ${item.color}`} />
                                    <p className="text-xs text-foreground/80 leading-relaxed">
                                        <span className="font-semibold">Pro tip:</span> {item.tip}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DOODLE TOOLTIP — hand-drawn bubble teaching users what the nav does       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DoodleTooltip({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -14, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 w-72 sm:w-80 pointer-events-auto"
                >
                    {/* Hand-drawn-style dark bubble */}
                    <div className="relative bg-foreground text-background rounded-2xl px-5 pt-5 pb-4 shadow-2xl ring-1 ring-background/5">
                        {/* Sketchy SVG arrow pointing up at the pills */}
                        <svg
                            className="absolute -top-3 left-1/2 -translate-x-1/2 text-foreground"
                            width="28"
                            height="14"
                            viewBox="0 0 28 14"
                            fill="currentColor"
                        >
                            <path d="M2 14 C6 14, 10 3, 14 1 C18 3, 22 14, 26 14 Z" />
                        </svg>

                        {/* ✕ close */}
                        <button
                            onClick={onDismiss}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-background/10 hover:bg-background/25 flex items-center justify-center text-background/50 hover:text-background text-xs transition-colors"
                            aria-label="Close tooltip"
                        >
                            ✕
                        </button>

                        {/* Title */}
                        <p className="text-sm font-semibold mb-3 pr-6">
                            ✨ Quick jump to any room!
                        </p>

                        {/* ── Animated demo row ─────────────────────────────── */}
                        <div className="relative mb-3">
                            <div className="flex items-center gap-2">
                                {/* Mini pill replicas */}
                                {(["🍳", "🛋️", "🛏️"] as const).map((emoji, i) => (
                                    <motion.div
                                        key={i}
                                        className="relative flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-background/10"
                                        animate={{
                                            scale: i === 1 ? [1, 1.15, 1] : 1,
                                            backgroundColor:
                                                i === 1
                                                    ? [
                                                        "rgba(255,255,255,0.08)",
                                                        "rgba(255,255,255,0.28)",
                                                        "rgba(255,255,255,0.08)",
                                                    ]
                                                    : "rgba(255,255,255,0.08)",
                                            borderColor:
                                                i === 1
                                                    ? [
                                                        "rgba(255,255,255,0.1)",
                                                        "rgba(255,255,255,0.4)",
                                                        "rgba(255,255,255,0.1)",
                                                    ]
                                                    : "rgba(255,255,255,0.1)",
                                        }}
                                        transition={{
                                            duration: 1.6,
                                            repeat: Infinity,
                                            repeatDelay: 1.2,
                                            delay: 0.6,
                                        }}
                                    >
                                        <span>{emoji}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* 👆 finger cursor — sits below the middle pill and taps it */}
                            <motion.span
                                className="absolute text-base pointer-events-none"
                                style={{ left: "calc(50% - 18px)", top: "calc(100% - 2px)" }}
                                animate={{
                                    y: [4, -4, 4],
                                    scale: [1, 0.82, 1],
                                    opacity: [0.6, 1, 0.6],
                                }}
                                transition={{
                                    duration: 1.6,
                                    repeat: Infinity,
                                    repeatDelay: 1.2,
                                    delay: 0.6,
                                }}
                            >
                                👆
                            </motion.span>
                        </div>

                        {/* spacer for the finger */}
                        <div className="h-5" />

                        {/* ── Scroll hint row ──────────────────────────────── */}
                        <div className="flex items-center gap-2 border-t border-background/10 pt-3">
                            <motion.div
                                className="flex items-center text-background/50 shrink-0"
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M3 8h10M9 4l4 4-4 4"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </motion.div>
                            <p className="text-xs text-background/50 leading-snug">
                                Tap a room to instantly scroll there
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ZONE NAV (sticky category pills)                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ZoneNav({ zones, activeZone, onSelect, progress, wifiPassed }: {
    zones: RoomZone[]
    activeZone: string
    onSelect: (id: string) => void
    progress: Record<string, number>
    wifiPassed: boolean
}) {
    const [hasWaved, setHasWaved] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)
    const tooltipTimers = useRef<ReturnType<typeof setTimeout>[]>([])

    // Trigger jiggle + tooltip when wifi card passes header
    useEffect(() => {
        if (wifiPassed && !hasWaved) {
            setHasWaved(true)
            // Show tooltip a beat after the jiggle starts
            tooltipTimers.current.push(
                setTimeout(() => setShowTooltip(true), 500)
            )
            // Auto-dismiss after 6.5 seconds
            tooltipTimers.current.push(
                setTimeout(() => setShowTooltip(false), 7000)
            )
        }
    }, [wifiPassed, hasWaved])

    // Clean up timers on unmount only
    useEffect(() => {
        return () => {
            tooltipTimers.current.forEach(clearTimeout)
        }
    }, [])

    const dismissTooltip = useCallback(() => setShowTooltip(false), [])

    return (
        <div className="sticky top-16 z-40 -mx-4 sm:-mx-6 lg:-mx-8">
            {/* Background layer — clips nothing */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
            <div className="relative px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl relative">
                    <div className="flex gap-1 py-3 overflow-x-auto scrollbar-none">
                        {zones.map((zone, i) => {
                            const isActive = activeZone === zone.id
                            const total = zone.items.length
                            const done = progress[zone.id] || 0
                            return (
                                <motion.div
                                    key={zone.id}
                                    /* Domino-wave: each pill jiggles in sequence, once */
                                    initial={{ x: 0, rotate: 0, scale: 1 }}
                                    animate={
                                        hasWaved
                                            ? {
                                                x: [0, -5, 6, -4, 5, -2, 0],
                                                rotate: [0, -3, 3, -2, 1, 0],
                                                scale: [1, 1.08, 0.97, 1.05, 1],
                                            }
                                            : { x: 0, rotate: 0, scale: 1 }
                                    }
                                    transition={{
                                        duration: 0.6,
                                        delay: i * 0.1,
                                        ease: "easeInOut",
                                    }}
                                    whileHover={{ scale: 1.06 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="shrink-0"
                                >
                                    <button
                                        onClick={() => {
                                            onSelect(zone.id)
                                            setShowTooltip(false)
                                        }}
                                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                            ? "bg-foreground text-background shadow-lg"
                                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        <span className="text-base">{zone.emoji}</span>
                                        <span className="hidden sm:inline">{zone.label}</span>
                                        {done > 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-background/20 text-background" : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                                                }`}>
                                                {done}/{total}
                                            </span>
                                        )}
                                    </button>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Doodle tooltip */}
                    <DoodleTooltip visible={showTooltip} onDismiss={dismissTooltip} />
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SCROLL PROGRESS BAR                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ScrollProgress() {
    const { scrollYProgress } = useScroll()
    const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
    return (
        <motion.div className="fixed top-16 left-0 right-0 h-0.75 z-50 bg-transparent">
            <motion.div
                className="h-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500"
                style={{ width }}
            />
        </motion.div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  DATA                                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const zones: RoomZone[] = [
    {
        id: "kitchen",
        label: "Kitchen",
        icon: <ChefHat className="h-5 w-5" />,
        emoji: "🍳",
        gradient: "from-orange-500 to-amber-500",
        description: "Your culinary playground — stovetop to coffee corner.",
        items: [
            {
                id: "stove",
                icon: <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600 dark:text-orange-400" />,
                emoji: "🔥",
                title: "Stove",
                subtitle: "Gas cooktop with auto-ignition",
                color: "text-orange-600 dark:text-orange-400",
                bgColor: "bg-orange-50 dark:bg-orange-950/40",
                steps: [
                    { label: "Turn on the gas", detail: "The gas valve is behind the stove. Turn counter-clockwise to open — you'll hear a gentle hiss.", icon: <Flame className="h-4 w-4 text-orange-500" /> },
                    { label: "Light the burner", detail: "Press and turn the corresponding knob counterclockwise, using the auto-ignition to light it. If auto-ignition fails, use a matchstick or gas lighter while holding the knob in.", icon: <Zap className="h-4 w-4 text-orange-500" /> },
                    { label: "When you're done", detail: "Turn all knobs OFF and close the gas valve behind the stove. Safety first! 🔥➡️❌", icon: <Power className="h-4 w-4 text-orange-500" /> },
                ],
                tip: "Always close the gas valve when done — it's the most important step! We've left some basic spices and cooking oil for you.",
            },
            {
                id: "oven",
                icon: <CookingPot className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600 dark:text-orange-400" />,
                emoji: "👨‍🍳",
                title: "Oven",
                subtitle: "Bake, roast, and reheat",
                color: "text-orange-600 dark:text-orange-400",
                bgColor: "bg-orange-50 dark:bg-orange-950/40",
                steps: [
                    { label: "Set the temperature", detail: "Turn the temperature knob to your desired setting.", icon: <Flame className="h-4 w-4 text-orange-500" /> },
                    { label: "Choose heating mode", detail: "Select the heating element configuration (top, bottom, or both), and turn the corresponding knob counterclockwise.", icon: <Zap className="h-4 w-4 text-orange-500" /> },
                    { label: "Set the timer", detail: "Turn the timer knob to the desired cooking duration.", icon: <CircleDot className="h-4 w-4 text-orange-500" /> },
                    { label: "Watch for the light", detail: "The orange indicator light will turn on to show the oven is heating.", icon: <Sun className="h-4 w-4 text-orange-500" /> },
                    { label: "Place your food", detail: "Place food in the center of the oven, avoiding frequent door opening.", icon: <CookingPot className="h-4 w-4 text-orange-500" /> },
                    { label: "When you're done", detail: "Turn all the knobs off.", icon: <Power className="h-4 w-4 text-orange-500" /> },
                ],
                tip: "Preheat for ~10 minutes before placing food in for best results.",
            },
            {
                id: "microwave",
                icon: <Microwave className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 dark:text-red-400" />,
                emoji: "⚡",
                title: "Microwave",
                subtitle: "Quick bites and reheats in seconds",
                color: "text-red-600 dark:text-red-400",
                bgColor: "bg-red-50 dark:bg-red-950/40",
                steps: [
                    { label: "Open & place food", detail: "Press the handle button. Place food on the glass turntable.", icon: <CircleDot className="h-4 w-4 text-red-500" /> },
                    { label: "Set the time", detail: "Use the dial or keypad. 1-2 minutes is usually enough for reheating.", icon: <Zap className="h-4 w-4 text-red-500" /> },
                    { label: "Press Start", detail: "Hit start and the turntable will rotate for even heating. Done!", icon: <Power className="h-4 w-4 text-red-500" /> },
                ],
                tip: "Never put metal or aluminum foil inside! When in doubt, use the glass plates we've provided.",
            },
            {
                id: "coffee",
                icon: <Coffee className="h-6 w-6 sm:h-7 sm:w-7 text-amber-700 dark:text-amber-400" />,
                emoji: "☕",
                title: "Coffee Machine",
                subtitle: "Start your morning the Rwandan way",
                color: "text-amber-700 dark:text-amber-400",
                bgColor: "bg-amber-50 dark:bg-amber-950/40",
                steps: [
                    { label: "Add coffee grounds", detail: "Open the top part of the coffee machine and add ground coffee to the coffee filter (generally 1–2 tablespoons of grounds for every 6 ounces of water).", icon: <Coffee className="h-4 w-4 text-amber-600" /> },
                    { label: "Pour water", detail: "Pour fresh, cold water into the reservoir behind the coffee filter (use the markings to measure cups).", icon: <Droplets className="h-4 w-4 text-amber-600" /> },
                    { label: "Start brewing", detail: "Close the lid, place the carafe (jug) on the heating plate, and turn the machine on.", icon: <Power className="h-4 w-4 text-amber-600" /> },
                    { label: "Enjoy", detail: "Enjoy your coffee. ☕", icon: <Sparkles className="h-4 w-4 text-amber-600" /> },
                ],
                tip: "Rwanda grows some of the world's best coffee! Try the local beans we've left — from a farm just 30 min away. 🇷🇼",
            },
            {
                id: "water-dispenser",
                icon: <Droplets className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-600 dark:text-cyan-400" />,
                emoji: "💧",
                title: "Water Dispenser",
                subtitle: "Cold, hot & warm water on demand",
                color: "text-cyan-600 dark:text-cyan-400",
                bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
                steps: [
                    { label: "Check it's ready", detail: "Ensure the unit is plugged in, with the water bottle loaded.", icon: <Power className="h-4 w-4 text-cyan-500" /> },
                    { label: "Turn on the switches", detail: "Turn on or off the hot/cold water switches behind the water dispenser.", icon: <Zap className="h-4 w-4 text-cyan-500" /> },
                    { label: "Dispense water", detail: "Place a glass under the spigot, then press the corresponding lever for cold, hot or warm water.", icon: <Droplets className="h-4 w-4 text-cyan-500" /> },
                    { label: "Hot water safety", detail: "For hot water, activate the safety lock by pushing the red designated tab, located on top of the hot water lever.", icon: <Lock className="h-4 w-4 text-cyan-500" /> },
                ],
                tip: "The red safety lock on the hot lever prevents accidental burns — always engage it before pressing.",
            },
        ],
    },
    {
        id: "living",
        label: "Living Room",
        icon: <Sofa className="h-5 w-5" />,
        emoji: "🛋️",
        gradient: "from-blue-500 to-indigo-500",
        description: "Your entertainment & relaxation HQ.",
        items: [
            {
                id: "tv",
                icon: <Tv className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />,
                emoji: "🍿",
                title: "Smart TV",
                subtitle: "Netflix, YouTube & more await",
                color: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-50 dark:bg-blue-950/40",
                steps: [
                    { label: "Grab the remote", detail: "", icon: <CircleDot className="h-4 w-4 text-blue-500" /> },
                    { label: "Power on", detail: "Big red button at the top. The TV wakes up with a gentle glow.", icon: <Power className="h-4 w-4 text-blue-500" /> },
                ],
                tip: "You can cast from your phone! Connect to the same Wi-Fi and look for the cast icon in your apps.",
            },
            {
                id: "lights",
                icon: <Lightbulb className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-600 dark:text-yellow-400" />,
                emoji: "💡",
                title: "Lights & Switches",
                subtitle: "Set the mood — bright or cozy",
                color: "text-yellow-600 dark:text-yellow-400",
                bgColor: "bg-yellow-50 dark:bg-yellow-950/40",
                steps: [
                    { label: "Wall switches", detail: "Near each room entrance. Up = on, down = off. Classic!", icon: <Lightbulb className="h-4 w-4 text-yellow-500" /> },
                    { label: "Outdoor lights", detail: "Controlled by switches near front & back doors.", icon: <Sun className="h-4 w-4 text-yellow-500" /> },

                ],
                tip: "Turn off all lights when leaving. The outdoor security lights are on automatic timers — they handle themselves!",
            },
        ],
    },
    {
        id: "bedroom",
        label: "Bedroom",
        icon: <Bed className="h-5 w-5" />,
        emoji: "🛏️",
        gradient: "from-purple-500 to-violet-500",
        description: "Rest, recharge, and wake up refreshed.",
        items: [
            {
                id: "mirrors",
                icon: <Eye className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 dark:text-purple-400" />,
                emoji: "✨",
                title: "LED Mirrors",
                subtitle: "Light up like a star",
                color: "text-purple-600 dark:text-purple-400",
                bgColor: "bg-purple-50 dark:bg-purple-950/40",
                steps: [
                    { label: "Find the sensor", detail: "Small touch area that glows on top of the mirror.", icon: <CircleDot className="h-4 w-4 text-purple-500" /> },
                    { label: "Tap to toggle", detail: "Multiple taps to change the light mode. LEDs glow with a soft, warm light.", icon: <Sun className="h-4 w-4 text-purple-500" /> },
                    { label: "Switch on/off the light sensor", detail: "Behind the bed on the side of the door, there's a switch to turn on/off the light sensor for the mirror lights.", icon: <Moon className="h-4 w-4 text-purple-500" /> },
                ],
                tip: "Perfect for skincare routines and selfies! Remember to turn them off when leaving the bathroom.",
            },
        ],
    },
    {
        id: "bathroom",
        label: "Bathroom",
        icon: <Bath className="h-5 w-5" />,
        emoji: "🚿",
        gradient: "from-teal-500 to-emerald-500",
        description: "Spa-quality showers and fresh vibes.",
        items: [
            {
                id: "shower",
                icon: <ShowerHead className="h-6 w-6 sm:h-7 sm:w-7 text-teal-600 dark:text-teal-400" />,
                emoji: "🧖",
                title: "Water Heater & Shower",
                subtitle: "Hot showers on demand",
                color: "text-teal-600 dark:text-teal-400",
                bgColor: "bg-teal-50 dark:bg-teal-950/40",
                steps: [
                    { label: "Flip the heater switch", detail: "Toggle switch on the bathroom wall above/near the bathroom sink or shower.", icon: <Zap className="h-4 w-4 text-teal-500" /> },
                    { label: "Adjust the temperature", detail: "Adjust the water temperature using the shower knob or the temperature knob of the water heater.", icon: <Droplets className="h-4 w-4 text-teal-500" /> },
                    { label: "After your shower", detail: "Turn off the heater — heats up fast next time!", icon: <Power className="h-4 w-4 text-teal-500" /> },
                ],
                tip: "It heats up fast! If lukewarm, reduce flow — less water = hotter temperature.",
            },
        ],
    },
    {
        id: "security",
        label: "Security",
        icon: <Settings className="h-5 w-5" />,
        emoji: "🔐",
        gradient: "from-emerald-500 to-green-500",
        description: "Locks, keys, and keeping everything safe.",
        items: [
            {
                id: "locks",
                icon: <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 dark:text-emerald-400" />,
                emoji: "🔑",
                title: "Door Locks & Security",
                subtitle: "Your safety is our priority",
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
                steps: [
                    { label: "Front door", detail: "Use the key — clockwise to lock, counter-clockwise to unlock. Always double-lock!", icon: <Lock className="h-4 w-4 text-emerald-500" /> },
                    { label: "Sliding doors", detail: "Close fully, push lock latch down at the base. Pull up to unlock.", icon: <CircleDot className="h-4 w-4 text-emerald-500" /> },
                    { label: "Security guard", detail: "On-site 24/7 — friendly and always happy to help with luggage or directions!", icon: <Sparkles className="h-4 w-4 text-emerald-500" /> },
                ],
                tip: "Lock doors even for short walks. The neighborhood is very safe, but it's always good practice!",
            },
        ],
    },
]

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function HouseGuidePage() {
    const [authenticated, setAuthenticated] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const [guestName, setGuestName] = useState("")
    const [activeZone, setActiveZone] = useState("kitchen")
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
    const [wifiPassed, setWifiPassed] = useState(false)
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const wifiSentinelRef = useRef<HTMLDivElement>(null)

    // Check if already authenticated this session
    useEffect(() => {
        const hasAccess = sessionStorage.getItem("guide_access")
        if (hasAccess === "true") {
            setAuthenticated(true)
            setGuestName(sessionStorage.getItem("guide_guest_name") || "")
        }
        setCheckingAuth(false)
    }, [])

    // Watch when the wifi sentinel scrolls past the header (top: 64px)
    useEffect(() => {
        const el = wifiSentinelRef.current
        if (!el) return
        let hasBeenVisible = false
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Sentinel entered the viewport — mark that we've seen it
                    hasBeenVisible = true
                } else if (hasBeenVisible) {
                    // Sentinel was visible, then scrolled out past the header → trigger
                    setWifiPassed(true)
                    observer.disconnect()
                }
            },
            { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])
    const markComplete = (id: string) => {
        setCompletedItems((prev) => new Set(prev).add(id))
    }

    // Calculate progress per zone
    const progress: Record<string, number> = {}
    zones.forEach((z) => {
        progress[z.id] = z.items.filter((item) => completedItems.has(item.id)).length
    })
    const totalItems = zones.reduce((sum, z) => sum + z.items.length, 0)
    const totalCompleted = completedItems.size
    const progressPct = Math.round((totalCompleted / totalItems) * 100)

    const scrollToZone = (id: string) => {
        setActiveZone(id)
        sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    // Loading state while checking session
    if (checkingAuth) {
        return (
            <main className="min-h-screen">
                <Header />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                </div>
                <Footer />
            </main>
        )
    }

    // Show auth modal if not authenticated
    if (!authenticated) {
        return (
            <main className="min-h-screen">
                <Header />
                <GuideAccessModal onSuccess={(name) => { setGuestName(name); setAuthenticated(true) }} />
                <Footer />
            </main>
        )
    }

    return (
        <main className="min-h-screen">
            <Header />
            <ScrollProgress />

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <div className="relative bg-background pt-28 pb-6 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-20 -left-32 w-96 h-96 bg-violet-200/30 dark:bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 -right-32 w-80 h-80 bg-fuchsia-200/20 dark:bg-fuchsia-900/10 rounded-full blur-3xl pointer-events-none" />

                <div className="mx-auto max-w-3xl relative">
                    {guestName && (
                        <FadeIn direction="up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5">
                                <span className="text-lg">👋</span>
                                <span className="text-sm font-semibold text-primary">
                                    Welcome, {guestName}
                                </span>
                            </div>
                        </FadeIn>
                    )}

                    {!guestName && (
                        <FadeIn direction="up">
                            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
                                Your complete home manual
                            </p>
                        </FadeIn>
                    )}

                    <FadeIn direction="up" delay={0.05}>
                        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground mb-5 leading-[1.1]">
                            Know your{" "}
                            <span className="relative inline-block">
                                <span className="relative z-10">house</span>
                                <motion.span
                                    className="absolute bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-full z-0"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                                    style={{ originX: 0 }}
                                />
                            </span>{" "}
                            inside out.
                        </h1>
                    </FadeIn>

                    <FadeIn direction="up" delay={0.1}>
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mb-8">
                            From the TV remote to the coffee maker, from LED mirrors to the Microwave. Tap through each room to master everything.
                        </p>
                    </FadeIn>

                    {/* Quick-jump room buttons */}
                    <FadeIn direction="up" delay={0.15}>
                        <div className="flex flex-wrap gap-3 mb-6">
                            {zones.map((z) => (
                                <button
                                    key={z.id}
                                    onClick={() => scrollToZone(z.id)}
                                    className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
                                >
                                    <span className="text-xl group-hover:scale-110 transition-transform">{z.emoji}</span>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-foreground leading-tight">{z.label}</p>
                                        <p className="text-[11px] text-muted-foreground">{z.items.length} {z.items.length === 1 ? "item" : "items"}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </div>

            {/* ── WI-FI BOARDING PASS ──────────────────────────────────── */}
            <div className="bg-background px-4 sm:px-6 lg:px-8 pb-8">
                <div className="mx-auto max-w-3xl">
                    <ScaleIn delay={0.1}>
                        <motion.div
                            className="relative rounded-3xl overflow-hidden bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xl shadow-purple-500/20"
                            whileHover={{ scale: 1.005 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Decorative circles */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <div className="absolute top-4 right-4 w-40 h-40 rounded-full border-2 border-white/30" />
                                <div className="absolute top-8 right-8 w-32 h-32 rounded-full border-2 border-white/20" />
                                <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full border-2 border-white/20" />
                            </div>

                            <div className="relative p-7 sm:p-9">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                                            animate={{ rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                                        >
                                            <Wifi className="h-6 w-6" />
                                        </motion.div>
                                        <div>
                                            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Connect to</p>
                                            <h2 className="font-serif text-2xl font-semibold">Wi-Fi</h2>
                                        </div>
                                    </div>

                                    {/* Signal bars */}
                                    <div className="flex items-end gap-0.5 h-6 pt-1">
                                        {[1, 2, 3, 4].map((bar) => (
                                            <motion.div
                                                key={bar}
                                                className="w-1.5 rounded-full bg-white/80"
                                                animate={{
                                                    height: [`${bar * 5}px`, `${bar * 5 + 4}px`, `${bar * 5}px`],
                                                    opacity: [0.6, 1, 0.6],
                                                }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: bar * 0.12 }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Ticket-style dashed divider */}
                                <div className="border-t border-dashed border-white/20 my-5 relative">
                                    <div className="absolute -left-11 -top-3 w-6 h-6 rounded-full bg-background" />
                                    <div className="absolute -right-11 -top-3 w-6 h-6 rounded-full bg-background" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">Network name</p>
                                        <p className="font-mono text-lg font-medium">Velstays</p>
                                    </div>
                                    <div>
                                        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">Password</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <p className="font-mono text-lg font-medium">Loveandchill</p>
                                            <CopyButton text="Loveandchill" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                    <p className="text-white/40 text-xs">High-speed • Stream, work, or just scroll 😄</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                                        </span>
                                        <span className="text-green-300 text-xs font-medium">Connected</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </ScaleIn>
                    {/* Sentinel: when this scrolls past the header, trigger the nav jiggle */}
                    <div ref={wifiSentinelRef} className="h-px -mt-px" aria-hidden="true" />
                </div>
            </div>

            {/* ── ZONE NAV + CONTENT ───────────────────────────────────── */}
            <div className="bg-background px-4 sm:px-6 lg:px-8 pb-20">
                <div className="mx-auto max-w-3xl">
                    <ZoneNav
                        zones={zones}
                        activeZone={activeZone}
                        onSelect={scrollToZone}
                        progress={progress}
                        wifiPassed={wifiPassed}
                    />

                    {/* Overall progress tracker */}
                    {totalCompleted > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-6 p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 flex items-center gap-3"
                        >
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                        {totalCompleted === totalItems ? "You're a house expert now! 🎉" : `${totalCompleted} of ${totalItems} explored`}
                                    </p>
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400">{progressPct}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-green-200 dark:bg-green-900/50 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-green-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${progressPct}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Zone Sections */}
                    {zones.map((zone) => (
                        <div
                            key={zone.id}
                            ref={(el) => { sectionRefs.current[zone.id] = el }}
                            className="mt-12 scroll-mt-32"
                        >
                            <FadeIn direction="up">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{zone.emoji}</span>
                                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
                                        {zone.label} hello
                                    </h2>
                                </div>
                                <p className="text-muted-foreground text-sm mb-6 pl-10">
                                    {zone.description}
                                </p>
                            </FadeIn>

                            <div className="space-y-3">
                                {zone.items.map((item) => (
                                    <StepCard
                                        key={item.id}
                                        item={item}
                                        completed={completedItems.has(item.id)}
                                        onComplete={() => markComplete(item.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* ── Help card ─────────────────────────────────────── */}
                    <FadeIn direction="up" delay={0.15}>
                        <div className="mt-16 p-6 sm:p-8 rounded-3xl border border-border bg-card">
                            <div className="flex items-start gap-4">
                                <motion.div
                                    className="shrink-0 w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </motion.div>
                                <div>
                                    <h3 className="font-semibold text-foreground text-lg mb-1">
                                        Something not working?
                                    </h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                        No stress — we&apos;re just a message away and happy to help anytime, day or night.
                                    </p>
                                    <a
                                        href="https://wa.me/250788459885"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-700 hover:bg-green-900 text-white text-sm font-medium transition-all active:scale-95 shadow-md shadow-green-500/20"
                                    >
                                        💬 WhatsApp us
                                    </a>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <ReadingNavigation
                        prev={{
                            href: "/check-in-check-out",
                            title: "Check-in & Check-out",
                            description: "Everything about your arrival and departure.",
                        }}
                        next={{
                            href: "/house-rules",
                            title: "House Rules",
                            description: "A few simple guidelines for a great stay.",
                        }}
                    />
                </div>
            </div>
            <Footer />
        </main>
    )
}
