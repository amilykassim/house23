import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const CONFIG_FILE = path.join(process.cwd(), "data", "calendar-config.json")

interface CalendarConfig {
    airbnbIcalUrl: string
}

function readConfig(): Record<string, CalendarConfig> {
    try {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8")
        return JSON.parse(raw)
    } catch {
        return {}
    }
}

function writeConfig(data: Record<string, CalendarConfig>) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2))
}

// Parse iCal data to extract booked date ranges
function parseICalDates(icalData: string): { start: string; end: string; summary: string }[] {
    const events: { start: string; end: string; summary: string }[] = []
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

// Expand date ranges into individual dates
function expandDateRange(start: string, end: string): string[] {
    const dates: string[] = []
    const current = new Date(start + "T00:00:00")
    const endDate = new Date(end + "T00:00:00")

    // DTEND in iCal is exclusive for all-day events
    while (current < endDate) {
        const y = current.getFullYear()
        const m = String(current.getMonth() + 1).padStart(2, "0")
        const d = String(current.getDate()).padStart(2, "0")
        dates.push(`${y}-${m}-${d}`)
        current.setDate(current.getDate() + 1)
    }

    return dates
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const house = searchParams.get("house")

    if (!house) {
        return NextResponse.json(
            { error: "Missing 'house' query parameter" },
            { status: 400 }
        )
    }

    const config = readConfig()
    const houseConfig = config[house]

    if (!houseConfig?.airbnbIcalUrl) {
        return NextResponse.json({
            dates: [],
            events: [],
            message: "No Airbnb iCal URL configured for this house",
        })
    }

    try {
        const response = await fetch(houseConfig.airbnbIcalUrl, {
            next: { revalidate: 0 },
            cache: "no-store",
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch Airbnb calendar: ${response.statusText}` },
                { status: 502 }
            )
        }

        const icalData = await response.text()
        const events = parseICalDates(icalData)

        // Expand all events into individual blocked dates
        const allDates = new Set<string>()
        events.forEach((event) => {
            const dates = expandDateRange(event.start, event.end)
            dates.forEach((d) => allDates.add(d))
        })

        return NextResponse.json({
            dates: Array.from(allDates).sort(),
            events,
        })
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch or parse Airbnb calendar" },
            { status: 502 }
        )
    }
}

// Update the Airbnb iCal URL for a house
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { house, airbnbIcalUrl } = body as {
        house: string
        airbnbIcalUrl: string
    }

    if (!house) {
        return NextResponse.json(
            { error: "Missing 'house' field" },
            { status: 400 }
        )
    }

    const config = readConfig()
    config[house] = {
        ...config[house],
        airbnbIcalUrl: airbnbIcalUrl || "",
    }
    writeConfig(config)

    return NextResponse.json({ success: true, config: config[house] })
}
