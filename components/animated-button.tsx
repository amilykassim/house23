"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const animatedButtonVariants = cva(
    "group/btn relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] overflow-hidden cursor-pointer touch-manipulation",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                outline:
                    "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3",
                lg: "h-10 rounded-md px-6",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

interface AnimatedButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof animatedButtonVariants> {
    /** Primary label shown by default */
    children: React.ReactNode
    /** Secondary label that slides in on hover */
    hoverText?: string
}

export function AnimatedButton({
    children,
    hoverText,
    className,
    variant,
    size,
    ...props
}: AnimatedButtonProps) {
    if (!hoverText) {
        return (
            <button
                className={cn(animatedButtonVariants({ variant, size, className }))}
                {...props}
            >
                {children}
            </button>
        )
    }

    return (
        <button
            className={cn(animatedButtonVariants({ variant, size, className }))}
            {...props}
        >
            <div className="relative overflow-hidden h-[1lh] w-full flex items-center justify-center">
                <span className="flex items-center justify-center w-full transition-transform duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] group-hover/btn:-translate-y-full group-active/btn:-translate-y-full">
                    {children}
                </span>
                <span className="absolute top-full left-0 flex items-center justify-center w-full transition-transform duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] group-hover/btn:-translate-y-full group-active/btn:-translate-y-full">
                    {hoverText}
                </span>
            </div>
        </button>
    )
}
