// The back office's booking and expense lists, fetched once and then kept in
// memory: moving between admin pages reuses them, a page refresh loads them
// again. A page that changes one calls the matching `forget…` so the next
// page that needs the list fetches it afresh.

const loaded = new Map<string, Promise<any>>()

function load(url: string): Promise<any> {
    let request = loaded.get(url)
    if (!request) {
        request = fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${url}: ${res.status}`))))
        loaded.set(url, request)
        // A failed load is not kept, so the next page tries again
        request.catch(() => loaded.get(url) === request && loaded.delete(url))
    }
    return request
}

/** Every booking, newest first. */
export const loadBookings = <T,>(): Promise<T[]> => load("/api/bookings").then((data) => data.bookings || [])
export const forgetBookings = () => void loaded.delete("/api/bookings")

/** Every expense, newest first. */
export const loadExpenses = <T,>(): Promise<T[]> => load("/api/expenses").then((data) => data.expenses || [])
export const forgetExpenses = () => void loaded.delete("/api/expenses")

/** Personal money: { expenses, stipends, monthlyStipend }. */
export const loadPersonal = <T,>(): Promise<T> => load("/api/personal-expenses")
export const forgetPersonal = () => void loaded.delete("/api/personal-expenses")

/**
 * Nights each house cannot be booked outside the bookings list (manual blocks
 * and the Airbnb calendar), from /api/availability. Not kept in memory: the
 * calendar changes them. A house whose read fails is left out.
 */
export async function loadUnavailable(slugs: string[]): Promise<Record<string, string[]>> {
    const entries = await Promise.all(
        slugs.map((slug) =>
            fetch(`/api/availability?house=${encodeURIComponent(slug)}`)
                .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
                .then((data) => (Array.isArray(data.dates) ? ([slug, data.dates] as const) : null))
                .catch(() => null)
        )
    )
    return Object.fromEntries(entries.filter((e): e is readonly [string, string[]] => e !== null))
}
