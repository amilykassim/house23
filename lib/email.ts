import { Resend } from "resend"
import { REJECTION_REASONS, type RejectionReason } from "@/lib/rejection-reasons"

// ⚠️ TEMPORARY: Email sending disabled during development
// Set to false to re-enable email sending
const EMAILS_DISABLED = false

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.FROM_EMAIL || "Velstays <bookings@resend.dev>"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "velstays1@gmail.com"
const SITE_URL = (process.env.SITE_URL || "https://velstays.com").replace(/\/$/, "")

export interface BookingEmailData {
    guestName: string
    guestEmail: string
    guestPhone?: string
    houseName: string
    checkIn: string
    checkOut: string
    nights: number
    guests: number
    total: number
    totalRwf: number
    momoTransactionId: string
    specialRequests?: string
    bookingId: string
    rejectionReason?: RejectionReason
}

// ---------------------------------------------------------------------------
// "Stationery" guest email design — ivory letterhead, Georgia serif, monogram
// seal, ledger with dotted leaders. Used for the three guest-facing emails;
// admin notifications keep the utilitarian layout further below.
// ---------------------------------------------------------------------------

const INK = "#211e18"
const IVORY = "#fbf9f4"
const FOREST = "#22553f"
const BRICK = "#8c3a2b"
const HAIRLINE = "#e4ded0"
const MUTED = "#7d766a"
const FAINT = "#a49b89"
const SERIF = "Georgia,'Times New Roman',serif"

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

/** "2026-09-12" → "Sat, Sep 12, 2026" (falls back to the raw string) */
function formatStayDate(dateStr: string): string {
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr + "T00:00:00" : dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

/** Guest access code for the house guide — last 4 digits of the booking phone */
function accessCodeFromPhone(phone?: string): string | null {
    const digits = (phone || "").replace(/\D/g, "")
    return digits.length >= 4 ? digits.slice(-4) : null
}

/**
 * One ledger line: label · dotted leader · value, with an optional second line
 * under the value (e.g. a time). Everything is top-aligned to the first line so
 * the row still reads correctly on narrow screens where the value wraps.
 */
function ledgerRow(label: string, value: string, sub?: string): string {
    return `
                        <tr>
                            <td valign="top" style="padding:9px 10px 9px 0;font-size:13px;line-height:1.4;color:${MUTED};white-space:nowrap;">${label}</td>
                            <td valign="top" style="width:100%;padding:9px 0 0;"><div style="border-bottom:1px dotted #c9c2b2;height:13px;font-size:0;line-height:0;">&nbsp;</div></td>
                            <td valign="top" style="padding:9px 0 9px 10px;font-size:13px;line-height:1.4;color:${INK};font-weight:600;text-align:right;white-space:nowrap;">${value}${sub ? `<div style="font-weight:400;font-size:11px;line-height:1.4;color:${FAINT};padding-top:2px;">${sub}</div>` : ""}</td>
                        </tr>`
}

/** Closing ledger line with a solid rule above (e.g. Total paid · $173) */
function ledgerTotalRow(label: string, value: string): string {
    return `
                        <tr>
                            <td valign="top" style="border-top:1px solid ${INK};padding:14px 10px 0 0;font-size:14px;line-height:1.6;color:${MUTED};white-space:nowrap;">${label}</td>
                            <td style="border-top:1px solid ${INK};"></td>
                            <td valign="top" style="border-top:1px solid ${INK};padding:11px 0 0 10px;font-family:${SERIF};font-size:18px;line-height:1.3;color:${INK};white-space:nowrap;text-align:right;">${value}</td>
                        </tr>`
}

/** Bordered note box on the letterhead */
function noteBox(html: string): string {
    return `
                <div style="border:1px solid ${HAIRLINE};background:#f5f1e8;padding:16px 18px;font-size:13px;line-height:1.65;color:#6d665a;margin:0 0 28px;">
                    ${html}
                </div>`
}

/** Full letterhead document: seal, wordmark, double rule, title, chip, body, footer */
function stationeryEmail(opts: {
    sealColor: string
    title: string
    introHtml: string
    chip: { label: string; bg: string; color: string }
    bodyHtml: string
}): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Keeps clients that honour it (Apple Mail, Outlook) from auto-inverting the letterhead -->
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background-color:#efece4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:36px 16px;">
        <div style="background:${IVORY};border:1px solid ${HAIRLINE};">
            <div style="padding:40px 32px 32px;">
                <!-- Monogram seal -->
                <div style="width:52px;height:52px;line-height:50px;margin:0 auto 16px;border:1px solid ${opts.sealColor};border-radius:50%;text-align:center;font-family:${SERIF};font-size:24px;font-style:italic;color:${opts.sealColor};">V</div>
                <p style="text-align:center;font-family:${SERIF};font-size:20px;letter-spacing:8px;text-indent:8px;color:${INK};margin:0 0 6px;">VELSTAYS</p>
                <p style="text-align:center;font-size:10px;letter-spacing:5px;text-indent:5px;text-transform:uppercase;color:${FAINT};margin:0 0 26px;">Our home is yours</p>
                <div style="border-top:1px solid ${INK};border-bottom:1px solid ${INK};height:3px;margin:0 0 30px;"></div>

                <h1 style="font-family:${SERIF};font-style:italic;font-weight:400;font-size:26px;color:${INK};text-align:center;margin:0 0 8px;">${opts.title}</h1>
                ${opts.introHtml}

                <p style="text-align:center;margin:0 0 30px;"><span style="display:inline-block;font-size:10px;letter-spacing:4px;text-indent:4px;text-transform:uppercase;padding:7px 16px;border-radius:2px;background:${opts.chip.bg};color:${opts.chip.color};">${opts.chip.label}</span></p>

                ${opts.bodyHtml}

                <!-- Footer -->
                <div style="border-top:1px solid ${HAIRLINE};padding-top:18px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${FAINT};">Velstays &middot; Kigali, Rwanda</p>
                    <p style="margin:0;font-size:12px;color:#6d665a;">+250 788 459 885</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`
}

const introStyle = `text-align:center;font-size:13px;color:${MUTED};line-height:1.6;margin:0 auto 28px;max-width:360px;`

export async function sendBookingAcknowledgment(data: BookingEmailData) {
    if (EMAILS_DISABLED) {
        console.log("[DEV] Email disabled — skipping acknowledgment email")
        return
    }
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — skipping acknowledgment email")
        return
    }

    const guestName = escapeHtml(data.guestName)
    const houseName = escapeHtml(data.houseName)

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.guestEmail,
            subject: `We have your request — Velstays ${data.houseName}`,
            html: stationeryEmail({
                sealColor: FOREST,
                title: "We have your request",
                introHtml: `<p style="${introStyle}">Dear <strong>${guestName}</strong>, thank you for choosing Velstays. Your request for <strong>Velstays ${houseName}</strong> is being reviewed &mdash; expect our confirmation within the hour.</p>`,
                chip: { label: "Pending Review", bg: "#f4ead2", color: "#7a5a17" },
                bodyHtml: `
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0;">
                    ${ledgerRow("Reservation", data.bookingId)}
                    ${ledgerRow("Residence", houseName)}
                    ${ledgerRow("Arrival", formatStayDate(data.checkIn))}
                    ${ledgerRow("Departure", formatStayDate(data.checkOut))}
                    ${ledgerRow("Nights", String(data.nights))}
                    ${ledgerRow("Guests", String(data.guests))}
                    ${ledgerTotalRow("Total", `$${data.total}`)}
                </table>
                <p style="text-align:right;font-size:11px;color:${FAINT};margin:6px 0 26px;">&asymp; ${data.totalRwf.toLocaleString()} RWF</p>
                ${data.specialRequests ? noteBox(`<strong style="color:${INK};">Special request.</strong> &ldquo;${escapeHtml(data.specialRequests)}&rdquo;`) : ""}`,
            }),
        })
    } catch (error: unknown) {
        console.error("Failed to send acknowledgment email:", error)
        // Note: With Resend's free tier (resend.dev domain), emails can only be sent
        // to the account owner's email. To send to arbitrary guest emails, verify a
        // custom domain at https://resend.com/domains
    }
}

export function buildBookingConfirmationEmail(data: BookingEmailData): { subject: string; html: string } {
    const guestName = escapeHtml(data.guestName)
    const houseName = escapeHtml(data.houseName)
    const accessCode = accessCodeFromPhone(data.guestPhone)
    const guideLink = `<a href="${SITE_URL}/house-guide" style="color:${FOREST};font-weight:600;text-decoration:underline;">house guide</a>`

    // The code unlocks the house guide, which holds the WiFi password and
    // arrival details. It's the last 4 digits of the phone used to book — the
    // same code /api/guide-access verifies.
    const accessHtml = accessCode
        ? `
                <div style="border:1px solid ${HAIRLINE};background:#f5f1e8;padding:20px 18px;margin:0 0 20px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${FAINT};">Your access code</p>
                    <p style="margin:0 0 6px;font-family:${SERIF};font-size:30px;letter-spacing:9px;text-indent:9px;color:${FOREST};">${accessCode}</p>
                    <p style="margin:0 0 14px;font-size:11px;color:${FAINT};">The last four digits of your phone number</p>
                    <p style="margin:0;font-size:13px;line-height:1.65;color:#6d665a;">Enter it on the ${guideLink} to unlock your <strong style="color:${INK};">WiFi password</strong>, check-in instructions and everything else about the house.</p>
                </div>`
        : `
                <div style="border:1px solid ${HAIRLINE};background:#f5f1e8;padding:16px 18px;margin:0 0 20px;font-size:13px;line-height:1.65;color:#6d665a;">
                    <strong style="color:${INK};">Your access code</strong> is the last four digits of the phone number you booked with. Enter it on the ${guideLink} to unlock your <strong style="color:${INK};">WiFi password</strong>, check-in instructions and everything else about the house.
                </div>`

    return {
        subject: `Your reservation is confirmed — Velstays ${data.houseName}`,
        html: stationeryEmail({
            sealColor: FOREST,
            title: "Your reservation is confirmed",
            introHtml: `<p style="${introStyle}">Dear <strong>${guestName}</strong>, it is our pleasure to confirm your stay at <strong>Velstays ${houseName}</strong>. We look forward to welcoming you.</p>`,
            chip: { label: "Confirmed", bg: FOREST, color: IVORY },
            bodyHtml: `
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0;">
                    ${ledgerRow("Reservation", data.bookingId)}
                    ${ledgerRow("Residence", houseName)}
                    ${ledgerRow("Arrival", formatStayDate(data.checkIn), "from 2:00 PM")}
                    ${ledgerRow("Departure", formatStayDate(data.checkOut), "by 11:00 AM")}
                    ${ledgerRow("Nights", String(data.nights))}
                    ${ledgerRow("Guests", String(data.guests))}
                    ${ledgerTotalRow("Total paid", `$${data.total}`)}
                </table>
                <p style="text-align:right;font-size:11px;color:${FAINT};margin:6px 0 26px;">&asymp; ${data.totalRwf.toLocaleString()} RWF</p>
                ${accessHtml}
                ${noteBox(`<strong style="color:${INK};">Arrival notes.</strong> Check-in from 2:00 PM Kigali Time, and check-out by 11:00 AM. The access code above is what opens your WiFi details and the full ${guideLink}. Questions &mdash; call us at <strong style="color:${INK};">+250 788 459 885</strong>.`)}`,
        }),
    }
}

export async function sendBookingConfirmation(data: BookingEmailData) {
    if (EMAILS_DISABLED) {
        console.log("[DEV] Email disabled — skipping confirmation email")
        return
    }
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — skipping confirmation email")
        return
    }

    try {
        const { subject, html } = buildBookingConfirmationEmail(data)
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.guestEmail,
            subject,
            html,
        })
    } catch (error) {
        console.error("Failed to send confirmation email:", error)
    }
}

export async function sendBookingCancellation(data: BookingEmailData) {
    if (EMAILS_DISABLED) {
        console.log("[DEV] Email disabled — skipping cancellation email")
        return
    }
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — skipping cancellation email")
        return
    }

    const guestName = escapeHtml(data.guestName)
    const houseName = escapeHtml(data.houseName)

    const message =
        data.rejectionReason && REJECTION_REASONS[data.rejectionReason]
            ? REJECTION_REASONS[data.rejectionReason].guestMessage
            : `Unfortunately, we were unable to confirm your booking for <strong>Velstays ${houseName}</strong> (${formatStayDate(data.checkIn)} &rarr; ${formatStayDate(data.checkOut)}).`

    const refundNote =
        data.rejectionReason && data.rejectionReason !== "policy_violation"
            ? `<strong style="color:${INK};">Your payment.</strong> If a payment was made, a full refund will be arranged. We'd be glad to help you find alternate dates &mdash; call us at <strong style="color:${INK};">+250 788 459 885</strong>.`
            : `<strong style="color:${INK};">Questions?</strong> Please contact us directly at <strong style="color:${INK};">+250 788 459 885</strong> &mdash; we're happy to help.`

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.guestEmail,
            subject: `Booking Update — Velstays ${data.houseName}`,
            html: stationeryEmail({
                sealColor: BRICK,
                title: "About your reservation",
                introHtml: `
                <p style="text-align:center;font-size:13px;color:${MUTED};line-height:1.6;margin:0 auto 10px;max-width:360px;">Dear <strong>${guestName}</strong>,</p>
                <p style="${introStyle}">${message}</p>`,
                chip: { label: "Not Confirmed", bg: BRICK, color: IVORY },
                bodyHtml: `
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 26px;">
                    ${ledgerRow("Reservation", data.bookingId)}
                    ${ledgerRow("Residence", houseName)}
                    ${ledgerRow("Arrival", formatStayDate(data.checkIn))}
                    ${ledgerRow("Departure", formatStayDate(data.checkOut))}
                </table>
                ${noteBox(refundNote)}`,
            }),
        })
    } catch (error) {
        console.error("Failed to send cancellation email:", error)
    }
}

export async function sendAdminNewBookingNotification(data: BookingEmailData) {
    if (EMAILS_DISABLED) {
        console.log("[DEV] Email disabled — skipping admin notification email")
        return
    }
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — skipping admin notification email")
        return
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: ADMIN_EMAIL,
            subject: `New Booking! ${data.bookingId} — ${data.guestName} · ${data.houseName}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
        <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <!-- Header -->
            <div style="background:#18181b;padding:32px 24px;text-align:center;">
                <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;">🔔 New Booking Request</h1>
                <p style="color:#a1a1aa;font-size:13px;margin:0;">${data.bookingId} · Velstays ${data.houseName}</p>
            </div>

            <!-- Body -->
            <div style="padding:24px;">
                <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px;">
                    A new booking request has been submitted and is awaiting your review.
                </p>

                <!-- Guest Info -->
                <div style="background:#eff6ff;border-radius:12px;padding:16px;margin:0 0 16px;">
                    <h3 style="color:#1e40af;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Guest</h3>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="color:#3b82f6;font-size:13px;padding:2px 0;">Name</td>
                            <td style="color:#1e3a5f;font-size:13px;padding:2px 0;text-align:right;font-weight:600;">${data.guestName}</td>
                        </tr>
                        ${data.guestEmail ? `<tr>
                            <td style="color:#3b82f6;font-size:13px;padding:2px 0;">Email</td>
                            <td style="color:#1e3a5f;font-size:13px;padding:2px 0;text-align:right;font-weight:600;">${data.guestEmail}</td>
                        </tr>` : ""}
                    </table>
                </div>

                <!-- Booking Details -->
                <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:0 0 16px;">
                    <h3 style="color:#18181b;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</h3>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">Property</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">Velstays ${data.houseName}</td>
                        </tr>
                        <tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">Check-in</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${data.checkIn}</td>
                        </tr>
                        <tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">Check-out</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${data.checkOut}</td>
                        </tr>
                        <tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">Nights</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${data.nights}</td>
                        </tr>
                        <tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">Guests</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${data.guests}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding:8px 0 0;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td>
                        </tr>
                        <tr>
                            <td style="color:#18181b;font-size:14px;padding:8px 0 4px;font-weight:700;">Total</td>
                            <td style="color:#18181b;font-size:14px;padding:8px 0 4px;text-align:right;font-weight:700;">$${data.total}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="color:#71717a;font-size:12px;padding:0;text-align:right;">≈ ${data.totalRwf.toLocaleString()} RWF</td>
                        </tr>
                        ${data.momoTransactionId ? `<tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">MoMo TXN</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;font-family:monospace;">${data.momoTransactionId}</td>
                        </tr>` : ""}
                    </table>
                </div>

                ${data.specialRequests ? `
                <div style="background:#fefce8;border-radius:12px;padding:16px;margin:0 0 16px;">
                    <p style="color:#854d0e;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Special Requests</p>
                    <p style="color:#713f12;font-size:13px;margin:0;line-height:1.5;">${data.specialRequests}</p>
                </div>
                ` : ""}

                <!-- Action -->
                <div style="background:#fef3c7;border-radius:12px;padding:16px;text-align:center;">
                    <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">⏳ Action Required</p>
                    <p style="color:#92400e;font-size:12px;margin:4px 0 0;opacity:0.8;">Review and confirm or reject this booking in the admin dashboard.</p>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="color:#a1a1aa;font-size:11px;margin:0;">Velstays · Kigali, Rwanda</p>
            </div>
        </div>
    </div>
</body>
</html>`,
        })
    } catch (error) {
        console.error("Failed to send admin notification email:", error)
    }
}

export async function sendAdminGuideAccessNotification(data: {
    guestName: string
    code: string
}) {
    if (EMAILS_DISABLED) {
        console.log("[DEV] Email disabled — skipping guide access notification email")
        return
    }
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — skipping guide access notification email")
        return
    }

    const accessTime = new Date().toLocaleString("en-US", {
        timeZone: "Africa/Kigali",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: ADMIN_EMAIL,
            subject: `WiFi Access — ${data.guestName} viewed WiFi details`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
        <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <!-- Header -->
            <div style="background:#18181b;padding:32px 24px;text-align:center;">
                <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;">📶 WiFi Access Notification</h1>
                <p style="color:#a1a1aa;font-size:13px;margin:0;">A guest has accessed the WiFi details</p>
            </div>

            <!-- Body -->
            <div style="padding:24px;">
                <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px;">
                    A guest has successfully entered their access code and viewed the house guide, including WiFi credentials.
                </p>

                <!-- Access Details -->
                <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 20px;">
                    <h3 style="color:#166534;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Access Details</h3>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="color:#15803d;font-size:13px;padding:4px 0;">Guest</td>
                            <td style="color:#166534;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${data.guestName}</td>
                        </tr>
                        <tr>
                            <td style="color:#15803d;font-size:13px;padding:4px 0;">Code Used</td>
                            <td style="color:#166534;font-size:13px;padding:4px 0;text-align:right;font-weight:600;font-family:monospace;">${data.code}</td>
                        </tr>
                        <tr>
                            <td style="color:#15803d;font-size:13px;padding:4px 0;">Time</td>
                            <td style="color:#166534;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${accessTime}</td>
                        </tr>
                    </table>
                </div>

                <div style="background:#eff6ff;border-radius:12px;padding:16px;text-align:center;">
                    <p style="color:#1e40af;font-size:13px;margin:0;font-weight:600;">ℹ️ For your records only</p>
                    <p style="color:#1e40af;font-size:12px;margin:4px 0 0;opacity:0.8;">No action needed — the guest now has access to the house guide.</p>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="color:#a1a1aa;font-size:11px;margin:0;">Velstays · Kigali, Rwanda</p>
            </div>
        </div>
    </div>
</body>
</html>`,
        })
    } catch (error) {
        console.error("Failed to send guide access notification email:", error)
    }
}
