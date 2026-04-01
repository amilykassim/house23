import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ShieldCheck, Clock, AlertTriangle, CalendarX, RefreshCw } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Cancellation Policy | House by AD",
    description: "Cancellation policy for bookings at House by AD.",
}

const policies = [
    {
        icon: ShieldCheck,
        title: "Free Cancellation — Up to 7 Days Before Check-in",
        description:
            "Cancel up to 7 days before your check-in time and receive a full refund. This gives you flexibility to adjust your plans if something unexpected comes up.",
        highlight: true,
    },
    {
        icon: Clock,
        title: "Partial Refund — 3 Days Before Check-in",
        description:
            "If you cancel between 3 and 7 days before check-in, you will receive a 50% refund of the total booking cost (excluding the service fee).",
        highlight: false,
    },
    {
        icon: AlertTriangle,
        title: "No Refund — Less Than 3 Days Before Check-in",
        description:
            "Cancellations made less than 3 days before check-in or after check-in are not eligible for a refund. No-shows are also non-refundable.",
        highlight: false,
    },
    {
        icon: CalendarX,
        title: "Early Departure",
        description:
            "If you check out early, the remaining nights will not be refunded. We recommend contacting the host if any issues arise during your stay so we can try to resolve them.",
        highlight: false,
    },
    {
        icon: RefreshCw,
        title: "Modification of Booking",
        description:
            "You can modify your booking dates subject to availability. If the new dates result in a lower total, the difference will be refunded. If the new dates cost more, you will be charged the difference.",
        highlight: false,
    },
]

export default function CancellationPolicyPage() {
    return (
        <main className="min-h-screen">
            <Header />
            <div className="bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
                        Cancellation Policy
                    </h1>
                    <p className="text-muted-foreground text-lg mb-12">
                        We understand plans can change. Here&apos;s our cancellation policy to help you plan with confidence.
                    </p>

                    {/* Timeline visual */}
                    <div className="relative space-y-0 mb-12">
                        {policies.map((policy, index) => (
                            <div key={policy.title} className="relative flex gap-6">
                                {/* Timeline line */}
                                {index < policies.length - 1 && (
                                    <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                                )}
                                {/* Icon */}
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 ${policy.highlight
                                        ? "bg-green-100 dark:bg-green-900/30"
                                        : "bg-primary/5"
                                        }`}
                                >
                                    <policy.icon
                                        className={`h-6 w-6 ${policy.highlight
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-primary"
                                            }`}
                                    />
                                </div>
                                {/* Content */}
                                <div className="pb-10">
                                    <h3 className="font-semibold text-foreground text-lg mb-1">{policy.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{policy.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary table */}
                    <div className="rounded-2xl border border-border overflow-hidden mb-12">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="text-left py-4 px-6 font-semibold text-foreground">When You Cancel</th>
                                    <th className="text-left py-4 px-6 font-semibold text-foreground">Refund</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t border-border">
                                    <td className="py-4 px-6 text-muted-foreground">7+ days before check-in</td>
                                    <td className="py-4 px-6 text-green-600 dark:text-green-400 font-medium">Full refund</td>
                                </tr>
                                <tr className="border-t border-border">
                                    <td className="py-4 px-6 text-muted-foreground">3–7 days before check-in</td>
                                    <td className="py-4 px-6 text-yellow-600 dark:text-yellow-400 font-medium">50% refund</td>
                                </tr>
                                <tr className="border-t border-border">
                                    <td className="py-4 px-6 text-muted-foreground">Less than 3 days / No-show</td>
                                    <td className="py-4 px-6 text-red-600 dark:text-red-400 font-medium">No refund</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-muted rounded-2xl">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Refunds are processed within 5–10 business days and returned to your original payment method. For bookings made through Airbnb, the platform&apos;s cancellation policy may also apply. If you have any questions, please contact your host directly.
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    )
}
