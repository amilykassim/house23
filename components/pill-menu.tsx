"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

interface PillMenuProps<T extends string | number> {
    options: { id: T; label: string }[]
    value: T
    onChange: (id: T) => void
    /** What the menu chooses, for screen readers */
    label: string
    /** Small heading at the top of the open menu */
    heading?: string
    /** Open above the pill instead of below, for one near the end of a page */
    above?: boolean
    className?: string
}

/**
 * Pill that opens a short list of choices, the current one ticked. The list
 * is rendered in place (no portal) so it keeps the admin font and scale.
 */
export function PillMenu<T extends string | number>({
    options,
    value,
    onChange,
    label,
    heading,
    above = false,
    className = "",
}: PillMenuProps<T>) {
    const [open, setOpen] = useState(false)
    const root = useRef<HTMLDivElement>(null)
    const listId = useId()

    // Close on a click outside or on Escape
    useEffect(() => {
        if (!open) return
        const onPointer = (e: PointerEvent) => {
            if (!root.current?.contains(e.target as Node)) setOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("pointerdown", onPointer)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onPointer)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    return (
        <div ref={root} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-label={label}
                className={`min-h-11 pl-[18px] pr-3.5 rounded-full border bg-card flex items-center gap-2.5 text-sm font-semibold text-foreground whitespace-nowrap ${open ? "border-foreground ring-1 ring-foreground" : "border-[#B0B0B0]"}`}
            >
                {options.find((o) => o.id === value)?.label}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div
                    id={listId}
                    role="listbox"
                    aria-label={label}
                    className={`absolute left-0 z-20 min-w-full w-max p-2 rounded-[20px] border border-border bg-card shadow-[0_6px_20px_rgba(0,0,0,0.12)] flex flex-col gap-0.5 ${above ? "bottom-full mb-2" : "top-full mt-2"}`}
                >
                    {heading && <span className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground">{heading}</span>}
                    {options.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            role="option"
                            aria-selected={option.id === value}
                            onClick={() => {
                                onChange(option.id)
                                setOpen(false)
                            }}
                            className={`min-h-11 px-3 rounded-xl flex items-center justify-between gap-6 text-left text-[15px] text-foreground hover:bg-[#F7F7F7] ${option.id === value ? "font-semibold" : ""}`}
                        >
                            {option.label}
                            {option.id === value && <Check className="h-[18px] w-[18px] shrink-0" strokeWidth={2.4} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
