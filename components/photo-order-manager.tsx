"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { GripVertical, Save, Loader2, Images, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import type { HousePhoto } from "@/lib/houses"

type PhotoOrderData = Record<string, string[]>

export function PhotoOrderManager() {
    const [selectedHouse, setSelectedHouse] = useState(houses[0]?.slug ?? "")
    const [photos, setPhotos] = useState<HousePhoto[]>([])
    const [originalPhotos, setOriginalPhotos] = useState<HousePhoto[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    const dragItem = useRef<number | null>(null)
    const dragOverItem = useRef<number | null>(null)
    const [dragIndex, setDragIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const loadOrder = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/photo-order")
            const order: PhotoOrderData = await res.json()
            const house = houses.find((h) => h.slug === selectedHouse)
            if (!house) return

            // Merge photos from both arrays, deduplicating by src
            const seen = new Set<string>()
            const allPhotos: HousePhoto[] = []
            for (const p of [...house.photos, ...house.allPhotos]) {
                if (!seen.has(p.src)) {
                    seen.add(p.src)
                    allPhotos.push(p)
                }
            }

            if (order[selectedHouse] && order[selectedHouse].length > 0) {
                const savedOrder = order[selectedHouse]
                // Sort photos based on saved order, put any new photos at the end
                const ordered: HousePhoto[] = []
                const remaining = [...allPhotos]

                for (const src of savedOrder) {
                    const idx = remaining.findIndex((p) => p.src === src)
                    if (idx !== -1) {
                        ordered.push(remaining.splice(idx, 1)[0])
                    }
                }
                // Append any photos not in the saved order (newly added)
                ordered.push(...remaining)
                setPhotos(ordered)
                setOriginalPhotos(ordered)
            } else {
                setPhotos(allPhotos)
                setOriginalPhotos(allPhotos)
            }
        } catch {
            const house = houses.find((h) => h.slug === selectedHouse)
            if (house) {
                const seen = new Set<string>()
                const merged: HousePhoto[] = []
                for (const p of [...house.photos, ...house.allPhotos]) {
                    if (!seen.has(p.src)) {
                        seen.add(p.src)
                        merged.push(p)
                    }
                }
                setPhotos(merged)
                setOriginalPhotos(merged)
            }
        } finally {
            setLoading(false)
        }
    }, [selectedHouse])

    useEffect(() => {
        loadOrder()
    }, [loadOrder])

    useEffect(() => {
        const changed = photos.some((p, i) => p.src !== originalPhotos[i]?.src)
        setHasChanges(changed)
    }, [photos, originalPhotos])

    const handleDragStart = (index: number) => {
        dragItem.current = index
        setDragIndex(index)
    }

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index
        setDragOverIndex(index)
    }

    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null) {
            setDragIndex(null)
            setDragOverIndex(null)
            return
        }

        const newPhotos = [...photos]
        const draggedItem = newPhotos.splice(dragItem.current, 1)[0]
        newPhotos.splice(dragOverItem.current, 0, draggedItem)

        setPhotos(newPhotos)
        dragItem.current = null
        dragOverItem.current = null
        setDragIndex(null)
        setDragOverIndex(null)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/photo-order", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: selectedHouse,
                    photos: photos.map((p) => p.src),
                }),
            })

            if (res.ok) {
                setOriginalPhotos([...photos])
                setHasChanges(false)
                toast("Photo order saved!", {
                    icon: "✓",
                    description: `${photos.length} photos reordered for ${houses.find((h) => h.slug === selectedHouse)?.name}`,
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
            toast("Failed to save", {
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
            setSaving(false)
        }
    }

    const handleReset = () => {
        setPhotos([...originalPhotos])
    }

    const house = houses.find((h) => h.slug === selectedHouse)

    return (
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Images className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Photo Order</h2>
                        <p className="text-xs text-muted-foreground">
                            Drag photos to reorder how they appear on the website
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Save className="h-3.5 w-3.5" />
                        )}
                        Save Order
                    </button>
                </div>
            </div>

            {/* House Selector */}
            <div className="flex gap-2 mb-5">
                {houses.map((h) => (
                    <button
                        key={h.slug}
                        onClick={() => setSelectedHouse(h.slug)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                            selectedHouse === h.slug
                                ? "bg-foreground text-background"
                                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                        <div className="w-6 h-6 rounded-md overflow-hidden shrink-0">
                            <img src={h.heroImage} alt={h.name} className="w-full h-full object-cover" />
                        </div>
                        {h.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <p className="text-xs text-muted-foreground mb-3">
                        {photos.length} photos · First 5 photos appear in the gallery grid
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.src}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragEnter={() => handleDragEnter(index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                                    dragIndex === index
                                        ? "opacity-40 scale-95 border-foreground/30"
                                        : dragOverIndex === index
                                        ? "border-foreground/50 scale-[1.02]"
                                        : index < 5
                                        ? "border-purple-500/30 hover:border-purple-500/50"
                                        : "border-border hover:border-foreground/30"
                                }`}
                            >
                                <div className="aspect-[4/3] relative">
                                    <img
                                        src={photo.src}
                                        alt={photo.alt}
                                        className="w-full h-full object-cover"
                                        draggable={false}
                                    />
                                    {/* Drag handle overlay */}
                                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-background/90 backdrop-blur-sm rounded-md p-1">
                                            <GripVertical className="h-3.5 w-3.5 text-foreground" />
                                        </div>
                                    </div>
                                    {/* Position badge */}
                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        index < 5
                                            ? "bg-purple-600 text-white"
                                            : "bg-background/90 backdrop-blur-sm text-foreground"
                                    }`}>
                                        {index + 1}
                                    </div>
                                    {/* Label */}
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                                        <p className="text-[10px] text-white/90 truncate">
                                            {photo.label}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <div className="w-3 h-3 rounded-full bg-purple-600" />
                        <span>Photos 1-5 appear in the gallery grid on the listing page</span>
                    </div>
                </>
            )}
        </div>
    )
}
