import { NextRequest, NextResponse } from "next/server"
import { readData, writeData } from "@/lib/storage"
import { fetchAirbnbAvailability } from "@/lib/airbnb-ical"

export const dynamic = "force-dynamic"

interface CalendarConfig {
    airbnbIcalUrl: string
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

    try {
        const result = await fetchAirbnbAvailability(house)

        if (!result) {
            return NextResponse.json({
                dates: [],
                events: [],
                message: "No Airbnb iCal URL configured for this house",
            })
        }

        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch or parse Airbnb calendar"
        return NextResponse.json({ error: message }, { status: 502 })
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

    const config = await readData<Record<string, CalendarConfig>>("calendar-config.json", {})
    config[house] = {
        ...config[house],
        airbnbIcalUrl: airbnbIcalUrl || "",
    }
    await writeData("calendar-config.json", config)

    return NextResponse.json({ success: true, config: config[house] })
}
