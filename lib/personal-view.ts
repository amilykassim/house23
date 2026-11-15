// Whether Insights shows Expenses and Profit after personal money (stipend
// plus personal expenses). The choice is kept on the device, so it stays on
// across visits; a link that names it ("?stipend=after" or "?stipend=before")
// still wins, so old and shared links show what they say.

export const PERSONAL_VIEW_KEY = "velstays:insights:after-personal"

type Store = Pick<Storage, "getItem" | "setItem">

/** The device's saved choice: true, false, or null when none was saved or it can't be read. */
export function readSavedAfterPersonal(store: Store | undefined): boolean | null {
    try {
        const saved = store?.getItem(PERSONAL_VIEW_KEY)
        return saved === "after" ? true : saved === "before" ? false : null
    } catch {
        return null
    }
}

/** Saves the choice; a store that refuses (private window, blocked) is ignored. */
export function saveAfterPersonal(store: Store | undefined, after: boolean): void {
    try {
        store?.setItem(PERSONAL_VIEW_KEY, after ? "after" : "before")
    } catch {
        // the choice then lasts until the page is left
    }
}

/** The link's "stipend" value first, then the saved choice, else before. */
export function resolveAfterPersonal(fromLink: string | null, saved: boolean | null): boolean {
    if (fromLink === "after") return true
    if (fromLink === "before") return false
    return saved ?? false
}
