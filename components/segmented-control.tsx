"use client"

import { useId } from "react"
import { motion } from "motion/react"

interface SegmentedControlProps<T extends string> {
    options: { id: T; label: string }[]
    /** The selected option; null leaves the control with nothing selected */
    value: T | null
    onChange: (id: T) => void
    itemClassName?: string
    className?: string
}

/** Pill switch whose white thumb slides to the selected option. */
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    itemClassName = "px-5",
    className = "",
}: SegmentedControlProps<T>) {
    const thumbId = useId()

    return (
        <div className={`flex gap-1 p-1 rounded-full bg-muted ${className}`}>
            {options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => onChange(option.id)}
                    aria-pressed={value === option.id}
                    className={`relative min-h-11 rounded-full text-[15px] font-semibold text-foreground ${itemClassName}`}
                >
                    {value === option.id && (
                        <motion.span
                            layoutId={thumbId}
                            className="absolute inset-0 rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
                            transition={{ type: "spring", stiffness: 480, damping: 38 }}
                        />
                    )}
                    <span className="relative">{option.label}</span>
                </button>
            ))}
        </div>
    )
}
