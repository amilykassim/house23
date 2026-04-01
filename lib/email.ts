import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || "House by AD <bookings@resend.dev>"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "amilykassim012@gmail.com"

interface BookingEmailData {
    guestName: string
    guestEmail: string
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
}

export async function sendBookingAcknowledgment(data: BookingEmailData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — skipping acknowledgment email")
        return
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.guestEmail,
            subject: `Booking Received — House by AD ${data.houseName}`,
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
                <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;">🏠 House by AD</h1>
                <p style="color:#a1a1aa;font-size:13px;margin:0;">Booking Request Received</p>
            </div>

            <!-- Body -->
            <div style="padding:24px;">
                <p style="color:#18181b;font-size:15px;margin:0 0 16px;">
                    Hi <strong>${data.guestName}</strong>,
                </p>
                <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px;">
                    Thank you for your booking request! We've received it and will review it shortly.
                    You'll receive a confirmation email once your booking is approved.
                </p>

                <!-- Booking Details -->
                <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:0 0 20px;">
                    <h3 style="color:#18181b;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">
                        Booking Details
                    </h3>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">Booking ID</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">${data.bookingId}</td>
                        </tr>
                        <tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">Property</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">House by AD ${data.houseName}</td>
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
                            <td colspan="2" style="color:#71717a;font-size:12px;padding:0;text-align:right;">
                                ≈ ${data.totalRwf.toLocaleString()} RWF
                            </td>
                        </tr>
                    </table>
                </div>

                ${data.specialRequests ? `
                <div style="background:#fefce8;border-radius:12px;padding:16px;margin:0 0 20px;">
                    <p style="color:#854d0e;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Special Requests</p>
                    <p style="color:#713f12;font-size:13px;margin:0;line-height:1.5;">${data.specialRequests}</p>
                </div>
                ` : ""}

                <!-- Status -->
                <div style="background:#fef3c7;border-radius:12px;padding:16px;text-align:center;">
                    <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">
                        ⏳ Status: Pending Review
                    </p>
                    <p style="color:#92400e;font-size:12px;margin:4px 0 0;opacity:0.8;">
                        We'll confirm your booking within 24 hours.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="color:#a1a1aa;font-size:11px;margin:0;">
                    House by AD · Kigali, Rwanda
                </p>
            </div>
        </div>
    </div>
</body>
</html>`,
        })
    } catch (error: unknown) {
        console.error("Failed to send acknowledgment email:", error)
        // Note: With Resend's free tier (resend.dev domain), emails can only be sent
        // to the account owner's email. To send to arbitrary guest emails, verify a
        // custom domain at https://resend.com/domains
    }
}

export async function sendBookingConfirmation(data: BookingEmailData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — skipping confirmation email")
        return
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.guestEmail,
            subject: `Booking Confirmed! — House by AD ${data.houseName}`,
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
            <div style="background:#166534;padding:32px 24px;text-align:center;">
                <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;">✅ Booking Confirmed!</h1>
                <p style="color:#bbf7d0;font-size:13px;margin:0;">House by AD ${data.houseName}</p>
            </div>

            <!-- Body -->
            <div style="padding:24px;">
                <p style="color:#18181b;font-size:15px;margin:0 0 16px;">
                    Hi <strong>${data.guestName}</strong>,
                </p>
                <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px;">
                    Great news! Your booking has been confirmed. We're looking forward to hosting you!
                </p>

                <!-- Confirmed Badge -->
                <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center;margin:0 0 20px;">
                    <p style="color:#166534;font-size:16px;margin:0;font-weight:700;">
                        ✓ Confirmed
                    </p>
                    <p style="color:#15803d;font-size:12px;margin:4px 0 0;">
                        Booking ID: ${data.bookingId}
                    </p>
                </div>

                <!-- Booking Details -->
                <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin:0 0 20px;">
                    <h3 style="color:#18181b;font-size:14px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">
                        Your Stay
                    </h3>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="color:#71717a;font-size:13px;padding:4px 0;">Property</td>
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">House by AD ${data.houseName}</td>
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
                            <td style="color:#18181b;font-size:14px;padding:8px 0 4px;font-weight:700;">Total Paid</td>
                            <td style="color:#18181b;font-size:14px;padding:8px 0 4px;text-align:right;font-weight:700;">$${data.total}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="color:#71717a;font-size:12px;padding:0;text-align:right;">
                                ≈ ${data.totalRwf.toLocaleString()} RWF
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Check-in Info -->
                <div style="background:#eff6ff;border-radius:12px;padding:16px;margin:0 0 20px;">
                    <p style="color:#1e40af;font-size:13px;margin:0;font-weight:600;">
                        📍 Check-in Time: 2:00 PM
                    </p>
                    <p style="color:#1e40af;font-size:12px;margin:4px 0 0;opacity:0.8;">
                        Check-out by 11:00 AM · Kicukiro, Kigali, Rwanda
                    </p>
                </div>

                <p style="color:#52525b;font-size:13px;line-height:1.6;margin:0;">
                    If you have any questions about your stay, feel free to reach out via WhatsApp at <strong>+250 788 459 885</strong>.
                </p>
            </div>

            <!-- Footer -->
            <div style="padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="color:#a1a1aa;font-size:11px;margin:0;">
                    House by AD · Kigali, Rwanda
                </p>
            </div>
        </div>
    </div>
</body>
</html>`,
        })
    } catch (error) {
        console.error("Failed to send confirmation email:", error)
    }
}

export async function sendBookingCancellation(data: BookingEmailData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set — skipping cancellation email")
        return
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: data.guestEmail,
            subject: `Booking Update — House by AD ${data.houseName}`,
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
            <div style="background:#991b1b;padding:32px 24px;text-align:center;">
                <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;">Booking Not Confirmed</h1>
                <p style="color:#fecaca;font-size:13px;margin:0;">House by AD ${data.houseName}</p>
            </div>

            <!-- Body -->
            <div style="padding:24px;">
                <p style="color:#18181b;font-size:15px;margin:0 0 16px;">
                    Hi <strong>${data.guestName}</strong>,
                </p>
                <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px;">
                    Unfortunately, we were unable to confirm your booking for
                    <strong>House by AD ${data.houseName}</strong> (${data.checkIn} → ${data.checkOut}).
                    This could be due to a scheduling conflict or other availability issue.
                </p>

                <div style="background:#fef2f2;border-radius:12px;padding:16px;margin:0 0 20px;">
                    <p style="color:#991b1b;font-size:13px;margin:0;font-weight:600;">
                        Booking ID: ${data.bookingId}
                    </p>
                    <p style="color:#991b1b;font-size:12px;margin:4px 0 0;opacity:0.8;">
                        If you made a payment, we will arrange a full refund.
                    </p>
                </div>

                <p style="color:#52525b;font-size:13px;line-height:1.6;margin:0;">
                    We'd love to host you on different dates! Feel free to check availability on our website
                    or contact us via WhatsApp at <strong>+250 788 459 885</strong>.
                </p>
            </div>

            <!-- Footer -->
            <div style="padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="color:#a1a1aa;font-size:11px;margin:0;">
                    House by AD · Kigali, Rwanda
                </p>
            </div>
        </div>
    </div>
</body>
</html>`,
        })
    } catch (error) {
        console.error("Failed to send cancellation email:", error)
    }
}

export async function sendAdminNewBookingNotification(data: BookingEmailData) {
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
                <p style="color:#a1a1aa;font-size:13px;margin:0;">${data.bookingId} · House by AD ${data.houseName}</p>
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
                            <td style="color:#18181b;font-size:13px;padding:4px 0;text-align:right;font-weight:600;">House by AD ${data.houseName}</td>
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
                <p style="color:#a1a1aa;font-size:11px;margin:0;">House by AD · Kigali, Rwanda</p>
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
