export type RejectionReason =
    | "dates_unavailable"
    | "payment_issue"
    | "policy_violation"
    | "maintenance"
    | "other"

export const REJECTION_REASONS: Record<RejectionReason, { label: string; guestMessage: string }> = {
    dates_unavailable: {
        label: "Dates unavailable",
        guestMessage: "Unfortunately, the dates you requested are no longer available due to a scheduling conflict.",
    },
    payment_issue: {
        label: "Payment not verified",
        guestMessage: "We were unable to verify your payment. Please ensure the MoMo transaction ID is correct, or try booking again with a valid payment.",
    },
    policy_violation: {
        label: "Policy violation",
        guestMessage: "Your booking request could not be accommodated as it does not align with our house rules or booking policies.",
    },
    maintenance: {
        label: "Property maintenance",
        guestMessage: "The property is currently undergoing scheduled maintenance during your requested dates and is temporarily unavailable.",
    },
    other: {
        label: "Other reason",
        guestMessage: "Unfortunately, we are unable to accommodate your booking request at this time.",
    },
}
