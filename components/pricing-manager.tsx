"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { DollarSign, Check, Loader2, Pencil, Tag, Home, Percent } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"

interface HousePricing {
    pricePerNight: number
    cleaningFee: number
    serviceFee: number
    airbnbPricePerNight: number
}

type PricingData = Record<string, HousePricing>

export function PricingManager() {
    const [pricing, setPricing] = useState<PricingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [editingField, setEditingField] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")
    const [saving, setSaving] = useState<string | null>(null)

    useEffect(() => {
        fetch("/api/prices")
            .then((res) => res.json())
            .then((data) => setPricing(data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleEdit = (slug: string, field: string, currentValue: number) => {
        const key = `${slug}-${field}`
        setEditingField(key)
        setEditValue(String(currentValue))
    }

    const handleSave = async (slug: string, field: string) => {
        const key = `${slug}-${field}`
        const numValue = parseFloat(editValue)

        if (isNaN(numValue) || numValue < 0) {
            toast("Invalid price", {
                icon: "⚠️",
                description: "Please enter a valid number",
                duration: 3000,
                unstyled: true,
                classNames: {
                    toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                    icon: "text-2xl mt-0.5 shrink-0",
                    title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                    description: "text-xs text-red-700/70 dark:text-red-300/70 mt-0.5",
                },
            })
            return
        }

        setSaving(key)

        try {
            const res = await fetch("/api/prices", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, [field]: numValue }),
            })

            if (res.ok) {
                setPricing((prev) => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        [slug]: { ...prev[slug], [field]: numValue },
                    }
                })
                setEditingField(null)
                toast("Price updated!", {
                    icon: "✓",
                    description: `${field === "pricePerNight" ? "Nightly rate" : field === "cleaningFee" ? "Cleaning fee" : field === "airbnbPricePerNight" ? "Airbnb price" : "Service fee"} set to $${numValue}`,
                    duration: 3000,
                    unstyled: true,
                    classNames: {
                        toast: "w-full flex items-start gap-3 bg-green-500/10 border border-green-200/60 dark:border-green-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                        icon: "text-2xl mt-0.5 shrink-0",
                        title: "font-semibold text-green-800 dark:text-green-200 text-sm",
                        description: "text-xs text-green-700/70 dark:text-green-300/70 mt-0.5",
                    },
                })
            }
        } catch {
            toast("Failed to update", {
                icon: "⚠️",
                duration: 3000,
                unstyled: true,
                classNames: {
                    toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                    icon: "text-2xl mt-0.5 shrink-0",
                    title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                },
            })
        } finally {
            setSaving(null)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, slug: string, field: string) => {
        if (e.key === "Enter") {
            handleSave(slug, field)
        } else if (e.key === "Escape") {
            setEditingField(null)
        }
    }

    if (loading) {
        return (
            <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Pricing</h2>
                        <p className="text-xs text-muted-foreground">Loading...</p>
                    </div>
                </div>
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    if (!pricing) return null

    const priceFields: { key: keyof HousePricing; label: string; icon: React.ReactNode; color: string }[] = [
        { key: "pricePerNight", label: "Nightly rate", icon: <DollarSign className="h-3.5 w-3.5" />, color: "text-green-600 dark:text-green-400 bg-green-500/10" },
        { key: "cleaningFee", label: "Cleaning fee", icon: <Tag className="h-3.5 w-3.5" />, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
        { key: "serviceFee", label: "Service fee", icon: <Percent className="h-3.5 w-3.5" />, color: "text-purple-600 dark:text-purple-400 bg-purple-500/10" },
        { key: "airbnbPricePerNight", label: "Airbnb price", icon: <Home className="h-3.5 w-3.5" />, color: "text-rose-600 dark:text-rose-400 bg-rose-500/10" },
    ]

    return (
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">Pricing</h2>
                    <p className="text-xs text-muted-foreground">
                        Update rates for each property
                    </p>
                </div>
            </div>

            {/* House cards */}
            <div className="space-y-5">
                {houses.map((house) => {
                    const housePricing = pricing[house.slug]
                    if (!housePricing) return null

                    const savings = housePricing.airbnbPricePerNight - housePricing.pricePerNight
                    const savingsPercent = housePricing.airbnbPricePerNight > 0
                        ? Math.round((savings / housePricing.airbnbPricePerNight) * 100)
                        : 0

                    return (
                        <div key={house.slug} className="rounded-xl overflow-hidden">
                            {/* House header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                                    <img
                                        src={house.heroImage}
                                        alt={house.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        {house.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{house.location}</p>
                                </div>
                                {savings > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 shrink-0">
                                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                                            {savingsPercent}% off Airbnb
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Price fields */}
                            <div className="grid grid-cols-2 gap-2">
                                {priceFields.map(({ key, label, icon, color }) => {
                                    const editKey = `${house.slug}-${key}`
                                    const isEditing = editingField === editKey
                                    const isSaving = saving === editKey
                                    const value = housePricing[key]

                                    return (
                                        <div
                                            key={key}
                                            className={`relative rounded-xl p-3 transition-all duration-200 ${
                                                isEditing
                                                    ? "bg-primary/[0.06] border border-primary/20 ring-1 ring-primary/10"
                                                    : "bg-muted/40 border border-transparent hover:bg-muted/60"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className={`w-5 h-5 rounded-md flex items-center justify-center ${color}`}>
                                                    {icon}
                                                </span>
                                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                                    {label}
                                                </span>
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {isEditing ? (
                                                    <motion.div
                                                        key="editing"
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onKeyDown={(e) => handleKeyDown(e, house.slug, key)}
                                                                autoFocus
                                                                className="w-full pl-6 pr-2 py-1.5 text-sm font-semibold bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleSave(house.slug, key)}
                                                            disabled={isSaving}
                                                            className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                                                        >
                                                            {isSaving ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.button
                                                        key="display"
                                                        initial={{ opacity: 0, y: -4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 4 }}
                                                        transition={{ duration: 0.15 }}
                                                        onClick={() => handleEdit(house.slug, key, value)}
                                                        className="w-full flex items-center justify-between group cursor-pointer"
                                                    >
                                                        <span className="text-lg font-bold text-foreground">
                                                            ${value}
                                                        </span>
                                                        <Pencil className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Separator between houses */}
                            {house.slug !== houses[houses.length - 1].slug && (
                                <div className="mt-5 border-t border-border/50" />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
