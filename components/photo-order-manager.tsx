"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { GripVertical, Save, Loader2, Images, RotateCcw, Tag, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { houses } from "@/lib/houses"
import type { HousePhoto } from "@/lib/houses"

type PhotoOrderData = Record<string, string[]>
type PhotoCategoryData = Record<string, Record<string, string>>

const CATEGORIES = [
    "Living Room",
    "Kitchen",
    "Bedroom",
    "Bathroom",
    "Game Room",
    "Office",
    "Outdoor",
    "Exterior",
]

export function PhotoOrderManager() {
    const [selectedHouse, setSelectedHouse] = useState(houses[0]?.slug ?? "")
    const [photos, setPhotos] = useState<HousePhoto[]>([])
    const [originalPhotos, setOriginalPhotos] = useState<HousePhoto[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState<string | null>(null)
    const [savedCategories, setSavedCategories] = useState<Record<string, string>>({})
    const [originalCategories, setOriginalCategories] = useState<Record<string, string>>({})

    const dragItem = useRef<number | null>(null)
    const dragOverItem = useRef<number | null>(null)
    const [dragIndex, setDragIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const loadOrder = useCallback(async () => {
        setLoading(true)
        try {
            const [orderRes, catRes] = await Promise.all([
                fetch("/api/photo-order"),
                fetch("/api/photo-categories"),
            ])
            const order: PhotoOrderData = await orderRes.json()
            const allCats: PhotoCategoryData = await catRes.json()
            const house = houses.find((h) => h.slug === selectedHouse)
            if (!house) return

            const houseCats = allCats[selectedHouse] || {}
            setSavedCategories({ ...houseCats })
            setOriginalCategories({ ...houseCats })

            // Merge photos from both arrays, deduplicating by src
            const seen = new Set<string>()
            const allPhotos: HousePhoto[] = []
            for (const p of [...house.photos, ...house.allPhotos]) {
                if (!seen.has(p.src)) {
                    seen.add(p.src)
                    // Apply saved category if exists, otherwise keep the one from houses.ts
                    const cat = houseCats[p.src] || p.category
                    allPhotos.push({ ...p, category: cat })
                }
            }

            if (order[selectedHouse] && order[selectedHouse].length > 0) {
                const savedOrder = order[selectedHouse]
                const ordered: HousePhoto[] = []
                const remaining = [...allPhotos]

                for (const src of savedOrder) {
                    const idx = remaining.findIndex((p) => p.src === src)
                    if (idx !== -1) {
                        ordered.push(remaining.splice(idx, 1)[0])
                    }
                }
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
        const orderChanged = photos.some((p, i) => p.src !== originalPhotos[i]?.src)
        const catChanged = JSON.stringify(savedCategories) !== JSON.stringify(originalCategories)
        setHasChanges(orderChanged || catChanged)
    }, [photos, originalPhotos, savedCategories, originalCategories])

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!categoryDropdownOpen) return
        const handle = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest("[data-category-dropdown]")) {
                setCategoryDropdownOpen(null)
            }
        }
        document.addEventListener("mousedown", handle)
        return () => document.removeEventListener("mousedown", handle)
    }, [categoryDropdownOpen])

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

        const fromIndex = dragItem.current
        const toIndex = dragOverItem.current

        if (fromIndex !== toIndex) {
            const newPhotos = [...photos]
            const [draggedItem] = newPhotos.splice(fromIndex, 1)
            newPhotos.splice(toIndex, 0, draggedItem)
            setPhotos(newPhotos)
        }

        dragItem.current = null
        dragOverItem.current = null
        setDragIndex(null)
        setDragOverIndex(null)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    // When filtering by category, drag within the filtered subset
    // by mapping filtered-list positions to full-array positions
    const handleFilteredDragStart = (filteredIdx: number, filteredList: HousePhoto[]) => {
        const realIndex = photos.findIndex((p) => p.src === filteredList[filteredIdx].src)
        handleDragStart(realIndex)
    }

    const handleFilteredDragEnter = (filteredIdx: number, filteredList: HousePhoto[]) => {
        const realIndex = photos.findIndex((p) => p.src === filteredList[filteredIdx].src)
        handleDragEnter(realIndex)
    }

    const handleCategoryChange = (photoSrc: string, newCategory: string) => {
        // Update the photos array
        setPhotos((prev) =>
            prev.map((p) => (p.src === photoSrc ? { ...p, category: newCategory } : p))
        )
        // Update saved categories
        setSavedCategories((prev) => ({ ...prev, [photoSrc]: newCategory }))
        setCategoryDropdownOpen(null)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Build category map from current photos state
            const categoryMap: Record<string, string> = { ...savedCategories }
            for (const p of photos) {
                if (p.category) categoryMap[p.src] = p.category
            }

            const [orderRes, catRes] = await Promise.all([
                fetch("/api/photo-order", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        slug: selectedHouse,
                        photos: photos.map((p) => p.src),
                    }),
                }),
                fetch("/api/photo-categories", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        slug: selectedHouse,
                        categories: categoryMap,
                    }),
                }),
            ])

            if (orderRes.ok && catRes.ok) {
                setOriginalPhotos([...photos])
                setOriginalCategories({ ...categoryMap })
                setSavedCategories({ ...categoryMap })
                setHasChanges(false)
                toast("Photos saved!", {
                    icon: "✓",
                    description: `Order & categories saved for ${houses.find((h) => h.slug === selectedHouse)?.name}`,
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
        setSavedCategories({ ...originalCategories })
    }

    // Get category counts
    const categoryCounts = photos.reduce<Record<string, number>>((acc, p) => {
        const cat = p.category || "Uncategorized"
        acc[cat] = (acc[cat] || 0) + 1
        return acc
    }, {})

    // Filter photos if a category is selected
    const displayPhotos = categoryFilter
        ? photos.filter((p) => (p.category || "Uncategorized") === categoryFilter)
        : photos

    // Get the actual index of a photo in the full photos array (for position badge)
    const getPhotoIndex = (photo: HousePhoto) => photos.findIndex((p) => p.src === photo.src)

    return (
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Images className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Photo Order & Categories</h2>
                        <p className="text-xs text-muted-foreground">
                            Drag to reorder, click category badges to reassign
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
                        Save
                    </button>
                </div>
            </div>

            {/* House Selector */}
            <div className="flex gap-2 mb-5">
                {houses.map((h) => (
                    <button
                        key={h.slug}
                        onClick={() => {
                            setSelectedHouse(h.slug)
                            setCategoryFilter(null)
                        }}
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
                    {/* Category filter chips */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Filter by category</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setCategoryFilter(null)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    categoryFilter === null
                                        ? "bg-foreground text-background"
                                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                All ({photos.length})
                            </button>
                            {CATEGORIES.filter((cat) => categoryCounts[cat]).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                        categoryFilter === cat
                                            ? "bg-foreground text-background"
                                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    {cat} ({categoryCounts[cat]})
                                </button>
                            ))}
                            {categoryCounts["Uncategorized"] && (
                                <button
                                    onClick={() => setCategoryFilter(categoryFilter === "Uncategorized" ? null : "Uncategorized")}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                        categoryFilter === "Uncategorized"
                                            ? "bg-foreground text-background"
                                            : "bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20"
                                    }`}
                                >
                                    Uncategorized ({categoryCounts["Uncategorized"]})
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                        {categoryFilter
                            ? `${displayPhotos.length} photos in "${categoryFilter}"`
                            : `${photos.length} photos · First 5 photos appear in the gallery grid`
                        }
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {displayPhotos.map((photo, filteredIdx) => {
                            const index = getPhotoIndex(photo)
                            return (
                                <div
                                    key={photo.src}
                                    draggable
                                    onDragStart={() =>
                                        categoryFilter
                                            ? handleFilteredDragStart(filteredIdx, displayPhotos)
                                            : handleDragStart(index)
                                    }
                                    onDragEnter={() =>
                                        categoryFilter
                                            ? handleFilteredDragEnter(filteredIdx, displayPhotos)
                                            : handleDragEnter(index)
                                    }
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
                                    <div className="aspect-4/3 relative">
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
                                        {/* Category badge + dropdown */}
                                        <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/70 to-transparent p-2 pt-8">
                                            <div className="relative" data-category-dropdown>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setCategoryDropdownOpen(
                                                            categoryDropdownOpen === photo.src ? null : photo.src
                                                        )
                                                    }}
                                                    className="flex items-center gap-1 text-[10px] font-medium text-white/90 hover:text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-md px-2 py-1 transition-colors"
                                                >
                                                    <Tag className="h-2.5 w-2.5" />
                                                    <span className="truncate max-w-[80px]">
                                                        {photo.category || "Uncategorized"}
                                                    </span>
                                                    <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                                                </button>
                                                {/* Dropdown */}
                                                {categoryDropdownOpen === photo.src && (
                                                    <div className="absolute bottom-full left-0 mb-1 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px] z-20 max-h-[200px] overflow-y-auto">
                                                        {CATEGORIES.map((cat) => (
                                                            <button
                                                                key={cat}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleCategoryChange(photo.src, cat)
                                                                }}
                                                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                                                                    photo.category === cat
                                                                        ? "bg-foreground/10 text-foreground font-medium"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                                                }`}
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-purple-600" />
                            <span>Photos 1-5 appear in the gallery grid</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3" />
                            <span>Click category badges to reassign</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
