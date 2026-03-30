"use client"

import { type ReactNode } from "react"
import { motion, type Variant } from "motion/react"
import { useInView } from "motion/react"
import { useRef } from "react"

type Direction = "up" | "down" | "left" | "right" | "none"

interface FadeInProps {
    children: ReactNode
    direction?: Direction
    delay?: number
    duration?: number
    className?: string
    once?: boolean
    amount?: number
}

const directionOffset: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: 24 },
    down: { x: 0, y: -24 },
    left: { x: 24, y: 0 },
    right: { x: -24, y: 0 },
    none: { x: 0, y: 0 },
}

export function FadeIn({
    children,
    direction = "up",
    delay = 0,
    duration = 0.5,
    className,
    once = true,
    amount = 0.3,
}: FadeInProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once, amount })
    const offset = directionOffset[direction]

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: offset.x, y: offset.y }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: offset.x, y: offset.y }}
            transition={{
                duration,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface StaggerContainerProps {
    children: ReactNode
    className?: string
    staggerDelay?: number
    once?: boolean
    amount?: number
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.1,
    once = true,
    amount = 0.2,
}: StaggerContainerProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once, amount })

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface StaggerItemProps {
    children: ReactNode
    className?: string
    direction?: Direction
}

export function StaggerItem({ children, className, direction = "up" }: StaggerItemProps) {
    const offset = directionOffset[direction]
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, x: offset.x, y: offset.y },
                visible: {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    transition: {
                        duration: 0.5,
                        ease: [0.21, 0.47, 0.32, 0.98],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface ScaleInProps {
    children: ReactNode
    className?: string
    delay?: number
    once?: boolean
}

export function ScaleIn({ children, className, delay = 0, once = true }: ScaleInProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once, amount: 0.3 })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{
                duration: 0.5,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
