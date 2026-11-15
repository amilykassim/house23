"use client"

import { AnimatePresence, motion } from "motion/react"
import { TriangleAlert } from "lucide-react"
import { REJECTION_REASONS, type RejectionReason } from "@/lib/rejection-reasons"

// Shared by the back office's Dashboard and Bookings pages: the status pill
// and the two panels that open before a booking is rejected or re-confirmed.

export type BookingStatus = "pending" | "confirmed" | "cancelled"

const STATUS_PILL: Record<BookingStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-[#FEF3C7] text-[#92400E]" },
    confirmed: { label: "Confirmed", className: "bg-[#DBEAFE] text-[#1E40AF]" },
    cancelled: { label: "Cancelled", className: "bg-[#F2F2F2] text-[#555555]" },
}

export function StatusPill({ status }: { status: BookingStatus }) {
    const pill = STATUS_PILL[status]
    return (
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${pill.className}`}>
            {pill.label}
        </span>
    )
}

// Buttons of the back office, sized for a thumb
export const BUTTON_DARK =
    "min-h-11 px-6 rounded-xl bg-foreground text-background text-[15px] font-bold hover:bg-foreground/85 transition-colors disabled:opacity-45"
export const BUTTON_OUTLINE =
    "min-h-11 px-6 rounded-xl border border-[#B0B0B0] bg-card text-foreground text-[15px] font-semibold hover:bg-[#F7F7F7] transition-colors disabled:opacity-45"

/** Folds its children open and shut. */
export function Fold({ open, children }: { open: boolean; children: React.ReactNode }) {
    return (
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function Warning({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-2.5 p-3.5 rounded-xl bg-[#FEF3C7] text-[#78350F]">
            <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold">{title}</p>
                <p className="text-[13px] leading-relaxed">{children}</p>
            </div>
        </div>
    )
}

interface PanelBooking {
    guestName: string
    checkIn: string
    checkOut: string
}

/** Pick why a booking is rejected, then confirm. `booking` adds the warning shown when a confirmed booking is cancelled. */
export function RejectPanel({
    booking,
    selected,
    onSelect,
    onConfirm,
    onCancel,
    busy,
}: {
    booking?: PanelBooking
    selected: RejectionReason
    onSelect: (reason: RejectionReason) => void
    onConfirm: () => void
    onCancel: () => void
    busy: boolean
}) {
    return (
        <div className="mt-3 p-4 rounded-2xl bg-[#F7F7F7] flex flex-col gap-3">
            {booking && (
                <Warning title="Double-check before cancelling">
                    This will send a cancellation email to <strong>{booking.guestName}</strong> and unblock the dates (
                    {booking.checkIn} → {booking.checkOut}) on the calendar, making them available again.
                </Warning>
            )}
            <p className="text-[13px] font-semibold text-muted-foreground">Select rejection reason:</p>
            <div className="flex flex-wrap gap-2">
                {(Object.keys(REJECTION_REASONS) as RejectionReason[]).map((reason) => (
                    <button
                        key={reason}
                        type="button"
                        onClick={() => onSelect(reason)}
                        aria-pressed={selected === reason}
                        className={`min-h-11 px-4 rounded-full border text-sm font-semibold ${selected === reason
                            ? "border-foreground bg-foreground text-background"
                            : "border-[#B0B0B0] bg-card text-foreground hover:bg-white"
                            }`}
                    >
                        {REJECTION_REASONS[reason].label}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={busy}
                    className="min-h-11 px-6 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-45"
                >
                    Confirm Rejection
                </button>
                <button type="button" onClick={onCancel} className={BUTTON_OUTLINE}>
                    Cancel
                </button>
            </div>
        </div>
    )
}

/** The check before a cancelled booking is confirmed again. */
export function ConfirmPanel({
    booking,
    onConfirm,
    onCancel,
    busy,
}: {
    booking: PanelBooking
    onConfirm: () => void
    onCancel: () => void
    busy: boolean
}) {
    return (
        <div className="mt-3 p-4 rounded-2xl bg-[#F7F7F7] flex flex-col gap-3">
            <Warning title="Double-check before confirming">
                This will send a confirmation email to <strong>{booking.guestName}</strong> and block the dates (
                {booking.checkIn} → {booking.checkOut}) on the calendar, preventing new bookings.
            </Warning>
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={onConfirm} disabled={busy} className={BUTTON_DARK}>
                    Proceed
                </button>
                <button type="button" onClick={onCancel} className={BUTTON_OUTLINE}>
                    Cancel
                </button>
            </div>
        </div>
    )
}
