// Guest emails the admin sends by hand from /admin/emails. Turns the form's
// fields into the same BookingEmailData the automatic emails use, so a
// hand-sent email is built by the exact same templates.
import {
    buildBookingAcknowledgmentEmail,
    buildBookingCancellationEmail,
    buildBookingConfirmationEmail,
    type BookingEmailData,
} from "@/lib/email"
import { houses } from "@/lib/houses"
import { USD_TO_RWF } from "@/lib/currency"
import { REJECTION_REASONS, type RejectionReason } from "@/lib/rejection-reasons"

export const MANUAL_EMAIL_TEMPLATES = ["request", "confirmed", "declined"] as const
export type ManualEmailTemplate = (typeof MANUAL_EMAIL_TEMPLATES)[number]

export type ParsedManualEmail =
    | { ok: true; template: ManualEmailTemplate; data: BookingEmailData }
    | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The templates print the reference without escaping it, so keep it plain
const BOOKING_ID_RE = /^[A-Za-z0-9-]{1,32}$/
const MAX_NIGHTS = 365

function isoDay(value: unknown): number | null {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    const ms = Date.parse(value + "T00:00:00Z")
    // Rejects dates like 2026-02-30 that Date would roll over
    if (isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== value) return null
    return ms
}

function str(value: unknown): string {
    return typeof value === "string" ? value.trim() : ""
}

/**
 * Validates the form body. `requireRecipient: false` is for the live preview,
 * which can render before the address is typed.
 */
export function parseManualEmail(
    body: unknown,
    { requireRecipient = true }: { requireRecipient?: boolean } = {},
): ParsedManualEmail {
    const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>

    const template = b.template as ManualEmailTemplate
    if (!MANUAL_EMAIL_TEMPLATES.includes(template)) return { ok: false, error: "Choose which email to send" }

    const guestEmail = str(b.email)
    if (requireRecipient && !EMAIL_RE.test(guestEmail)) return { ok: false, error: "Enter a valid guest email" }

    const guestName = str(b.guestName)
    if (!guestName) return { ok: false, error: "Enter the guest's name" }
    if (guestName.length > 100) return { ok: false, error: "The guest's name is too long" }

    const house = houses.find((h) => h.slug === b.house)
    if (!house) return { ok: false, error: "Choose a house" }

    const checkInMs = isoDay(b.checkIn)
    const checkOutMs = isoDay(b.checkOut)
    if (checkInMs === null) return { ok: false, error: "Enter a check-in date" }
    if (checkOutMs === null) return { ok: false, error: "Enter a check-out date" }
    const nights = Math.round((checkOutMs - checkInMs) / 86_400_000)
    if (nights < 1) return { ok: false, error: "Check-out must be after check-in" }
    if (nights > MAX_NIGHTS) return { ok: false, error: `A stay can't be longer than ${MAX_NIGHTS} nights` }

    const guests = Number(b.guests)
    if (!Number.isInteger(guests) || guests < 1 || guests > house.guests) {
        return { ok: false, error: `Guests must be between 1 and ${house.guests} for ${house.name}` }
    }

    const bookingId = str(b.bookingId)
    if (!BOOKING_ID_RE.test(bookingId)) {
        return { ok: false, error: "Enter the booking reference, e.g. BK-014 (letters, numbers and dashes)" }
    }

    // Like Add booking, the amount is entered in RWF and USD is derived from it
    let totalRwf = 0
    if (template !== "declined") {
        totalRwf = Number(b.totalRwf)
        if (b.totalRwf === "" || b.totalRwf == null || !Number.isFinite(totalRwf) || totalRwf < 0) {
            return { ok: false, error: "Enter the total in RWF" }
        }
        totalRwf = Math.round(totalRwf)
    }

    let rejectionReason: RejectionReason | undefined
    if (template === "declined") {
        if (typeof b.reason !== "string" || !Object.hasOwn(REJECTION_REASONS, b.reason)) {
            return { ok: false, error: "Choose a reason" }
        }
        rejectionReason = b.reason as RejectionReason
    }

    const guestPhone = template === "confirmed" ? str(b.phone) : ""
    if (guestPhone.length > 40) return { ok: false, error: "The phone number is too long" }

    return {
        ok: true,
        template,
        data: {
            guestName,
            guestEmail,
            guestPhone: guestPhone || undefined,
            houseName: house.name,
            checkIn: b.checkIn as string,
            checkOut: b.checkOut as string,
            nights,
            guests,
            total: Math.round((totalRwf / USD_TO_RWF) * 100) / 100,
            totalRwf,
            momoTransactionId: "",
            bookingId,
            rejectionReason,
        },
    }
}

export function buildManualEmail(template: ManualEmailTemplate, data: BookingEmailData): { subject: string; html: string } {
    if (template === "request") return buildBookingAcknowledgmentEmail(data)
    if (template === "confirmed") return buildBookingConfirmationEmail(data)
    return buildBookingCancellationEmail(data)
}
