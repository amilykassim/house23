"use client"

import { motion } from "motion/react"

interface Highlight {
    title: string
    description: string
    icon: "sparkle" | "location" | "calendar" | "lock" | "workspace" | "gamepad"
}

const iconMap: Record<Highlight["icon"], JSX.Element> = {
    sparkle: (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
    ),
    location: (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    calendar: (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    lock: (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    ),
    workspace: (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    gamepad: (
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h2m0 0h2M8 12V10m0 2v2m6-4h.01M16 10h.01" />
        </svg>
    ),
}

export function AnimatedHighlights({ highlights }: { highlights: Highlight[] }) {
    return (
        <section className="pt-8 border-t border-border">
            <div className="grid gap-6">
                {highlights.map((highlight, i) => (
                    <motion.div
                        key={highlight.title}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{
                            duration: 0.5,
                            delay: i * 0.15,
                            ease: [0.21, 0.47, 0.32, 0.98],
                        }}
                        className="flex gap-4"
                    >
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{
                                duration: 0.4,
                                delay: i * 0.15 + 0.1,
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                            }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center shrink-0"
                        >
                            {iconMap[highlight.icon]}
                        </motion.div>
                        <div>
                            <h3 className="font-semibold text-foreground">{highlight.title}</h3>
                            <p className="text-muted-foreground text-sm">{highlight.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
