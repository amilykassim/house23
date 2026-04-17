import { readData } from "@/lib/storage"
import type { HouseData, HousePhoto } from "@/lib/houses"

type PhotoOrderData = Record<string, string[]>
type PhotoCategoryData = Record<string, Record<string, string>>

export async function getOrderedPhotos(house: HouseData): Promise<{
    photos: HousePhoto[]
    allPhotos: HousePhoto[]
}> {
    try {
        const [order, categories] = await Promise.all([
            readData<PhotoOrderData>("photo-order.json", {}),
            readData<PhotoCategoryData>("photo-categories.json", {}),
        ])
        const savedOrder = order[house.slug]
        const savedCategories = categories[house.slug] || {}

        // Helper to apply saved category overrides
        const applyCategory = (photo: HousePhoto): HousePhoto => {
            const savedCat = savedCategories[photo.src]
            if (savedCat) {
                return { ...photo, category: savedCat }
            }
            return photo
        }

        if (!savedOrder || savedOrder.length === 0) {
            return {
                photos: house.photos.map(applyCategory),
                allPhotos: house.allPhotos.map(applyCategory),
            }
        }

        // Merge photos + allPhotos, deduplicating by src
        const seen = new Set<string>()
        const allCombined: HousePhoto[] = []
        for (const p of [...house.photos, ...house.allPhotos]) {
            if (!seen.has(p.src)) {
                seen.add(p.src)
                allCombined.push(applyCategory(p))
            }
        }

        // Reorder based on saved order
        const ordered: HousePhoto[] = []
        const remaining = [...allCombined]

        for (const src of savedOrder) {
            const idx = remaining.findIndex((p) => p.src === src)
            if (idx !== -1) {
                ordered.push(remaining.splice(idx, 1)[0])
            }
        }
        // Append any photos not in the saved order
        ordered.push(...remaining)

        // First 5 ordered photos become the grid photos
        const photos = ordered.slice(0, 5)

        return { photos, allPhotos: ordered }
    } catch {
        return { photos: house.photos, allPhotos: house.allPhotos }
    }
}
