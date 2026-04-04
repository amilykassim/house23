import { NextRequest, NextResponse } from "next/server"
import { readData } from "@/lib/storage"

function formatICalDate(dateStr: string): string {
    // dateStr is "yyyy-MM-dd", convert to "YYYYMMDD"
    return dateStr.replace(/-/g, "")
}

function nextDay(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00")
    d.setDate(d.getDate() + 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}${m}${day}`
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const data = await readData<Record<string, string[]>>("blocked-dates.json", {})
    const dates = (data[slug] || []).sort()

    // Group consecutive dates into ranges for cleaner iCal output
    const ranges: { start: string; end: string }[] = []
    let i = 0
    while (i < dates.length) {
        const rangeStart = dates[i]
        let rangeEnd = dates[i]
        while (i + 1 < dates.length) {
            const current = new Date(dates[i] + "T00:00:00")
            const next = new Date(dates[i + 1] + "T00:00:00")
            const diff = (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
            if (diff === 1) {
                rangeEnd = dates[i + 1]
                i++
            } else {
                break
            }
        }
        ranges.push({ start: rangeStart, end: rangeEnd })
        i++
    }

    const now = new Date()
    const timestamp =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "T" +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0") +
        "Z"

    let ical = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//House by AD//Calendar//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:House by AD - ${slug}\r\n`

    ranges.forEach((range, idx) => {
        const dtstart = formatICalDate(range.start)
        // DTEND for all-day events is exclusive (day after last blocked day)
        const dtend = nextDay(range.end)
        ical += `BEGIN:VEVENT\r\n`
        ical += `DTSTART;VALUE=DATE:${dtstart}\r\n`
        ical += `DTEND;VALUE=DATE:${dtend}\r\n`
        ical += `DTSTAMP:${timestamp}\r\n`
        ical += `UID:blocked-${slug}-${range.start}-${idx}@housebyadcasa\r\n`
        ical += `SUMMARY:Blocked - House by AD\r\n`
        ical += `DESCRIPTION:Dates blocked via House by AD calendar management\r\n`
        ical += `STATUS:CONFIRMED\r\n`
        ical += `END:VEVENT\r\n`
    })

    ical += `END:VCALENDAR\r\n`

    return new NextResponse(ical, {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="${slug}-calendar.ics"`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    })
}
