import { NextRequest, NextResponse } from "next/server"
import { getHouseSetting } from "@/lib/store"
import type { FeedRead } from "@/app/api/calendar/[slug]/ical/route"

export const dynamic = "force-dynamic"

// Who last downloaded this house's calendar feed, newest first (admin only).
// Shows whether Airbnb is actually reading the feed.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    if (request.cookies.get("admin_auth")?.value !== "authenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slug } = await params
    const reads = (await getHouseSetting<FeedRead[]>("feed-reads", slug)) ?? []
    return NextResponse.json({ reads })
}
