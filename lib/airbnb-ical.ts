import { readData } from "@/lib/storage"

export interface AirbnbEvent {
    start: string
    end: string
    summary: string
}

interface CalendarConfig {
    airbnbIcalUrl: string
}

// Parse iCal data to extract booked date ranges
export function parseICalDates(icalData: string): AirbnbEvent[] {
    const events: AirbnbEvent[] = []
    const eventBlocks = icalData.split("BEGIN:VEVENT")

    for (let i = 1; i < eventBlocks.length; i++) {
        const block = eventBlocks[i]
        const endIdx = block.indexOf("END:VEVENT")
        const eventData = endIdx >= 0 ? block.substring(0, endIdx) : block

        let dtstart = ""
        let dtend = ""
        let summary = "Airbnb Booking"

        // Handle both DATE and DATETIME formats
        const dtstartMatch = eventData.match(/DTSTART[^:]*:(\d{8})/)
        const dtendMatch = eventData.match(/DTEND[^:]*:(\d{8})/)
        const summaryMatch = eventData.match(/SUMMARY:(.+?)(?:\r?\n|\r)/)

        if (dtstartMatch) {
            const ds = dtstartMatch[1]
            dtstart = `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`
        }
        if (dtendMatch) {
            const de = dtendMatch[1]
            dtend = `${de.slice(0, 4)}-${de.slice(4, 6)}-${de.slice(6, 8)}`
        }
        if (summaryMatch) {
            summary = summaryMatch[1].trim()
        }

        if (dtstart && dtend) {
            events.push({ start: dtstart, end: dtend, summary })
        }
    }

    return events
}

// Expand a [start, end) range of "yyyy-MM-dd" strings into individual dates.
// DTEND in iCal is exclusive for all-day events, and a checkout day is not a night.
export function expandDateRange(start: string, end: string): string[] {
    const dates: string[] = []
    const current = new Date(start + "T00:00:00")
    const endDate = new Date(end + "T00:00:00")

    while (current < endDate) {
        const y = current.getFullYear()
        const m = String(current.getMonth() + 1).padStart(2, "0")
        const d = String(current.getDate()).padStart(2, "0")
        dates.push(`${y}-${m}-${d}`)
        current.setDate(current.getDate() + 1)
    }

    return dates
}

/**
 * Fetch and parse the Airbnb iCal feed for a house.
 * Returns null when no feed is configured; throws when the feed cannot be fetched.
 */
export async function fetchAirbnbAvailability(
    house: string
): Promise<{ dates: string[]; events: AirbnbEvent[] } | null> {
    const config = await readData<Record<string, CalendarConfig>>("calendar-config.json", {})
    const url = config[house]?.airbnbIcalUrl
    if (!url) return null

    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) {
        throw new Error(`Failed to fetch Airbnb calendar: ${response.statusText}`)
    }

    const events = parseICalDates(await response.text())
    const allDates = new Set<string>()
    events.forEach((event) => {
        expandDateRange(event.start, event.end).forEach((d) => allDates.add(d))
    })

    return { dates: Array.from(allDates).sort(), events }
}

/**
 * Every date that cannot be booked for a house: manual blocks plus Airbnb bookings.
 * If Airbnb is unreachable, falls back to manual blocks only.
 */
export async function getUnavailableDates(house: string): Promise<Set<string>> {
    const blocked = await readData<Record<string, string[]>>("blocked-dates.json", {})
    const unavailable = new Set<string>(blocked[house] || [])
    try {
        const airbnb = await fetchAirbnbAvailability(house)
        airbnb?.dates.forEach((d) => unavailable.add(d))
    } catch {
        // Airbnb unreachable: rely on manual blocks
    }
    return unavailable
}
