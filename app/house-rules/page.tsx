import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ReadingNavigation } from "@/components/reading-navigation"
import type { ReactNode } from "react"
import { Clock, Users, Volume2, Cigarette, Dog, PartyPopper, Baby, ShieldCheck, Trash2, Key } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "House Rules | House by AD",
    description: "House rules for your stay at House by AD. Please review before booking.",
}

const rules = [
    {
        icon: Clock,
        title: "Check-in / Check-out",
        description: (
            <>
                Check-in is from <span className="font-medium text-foreground">2:00 PM</span>. Check-out is by <span className="font-medium text-foreground">11:00 AM</span>. Please respect these times to allow for thorough cleaning between guests.
            </>
        ),
    },
    {
        icon: Users,
        title: "Maximum Guests",
        description: (
            <>
                The property accommodates up to <span className="font-medium text-foreground">3 guests</span>. No additional guests or visitors are allowed without <span className="font-medium text-foreground">prior approval</span> from the host.
            </>
        ),
    },
    {
        icon: Cigarette,
        title: "No Smoking",
        description: (
            <>
                Smoking is <span className="font-medium text-foreground">strictly prohibited</span> inside the house. If you must smoke, please do so outside in designated areas and dispose of cigarette butts properly.
            </>
        ),
    },
    {
        icon: Dog,
        title: "No Pets",
        description: "Pets are not allowed on the property. This policy is in place to maintain cleanliness and accommodate guests with allergies.",
    },
    {
        icon: PartyPopper,
        title: "No Parties or Events",
        description: "Parties, events, and large gatherings are not permitted. Please be considerate of the quiet, residential neighborhood.",
    },
    {
        icon: Volume2,
        title: "Quiet Hours",
        description: (
            <>
                Please observe quiet hours from <span className="font-medium text-foreground">10:00 PM</span> to <span className="font-medium text-foreground">7:00 AM</span>. Our home is located in a peaceful residential area, and we ask guests to be respectful of our neighbors.
            </>
        ),
    },
    {
        icon: Baby,
        title: "Children",
        description: (
            <>
                Children are welcome but must be <span className="font-medium text-foreground">supervised at all times</span>. The property is <span className="font-medium text-foreground">not fully childproofed</span>, so please take extra care.
            </>
        ),
    },
    {
        icon: ShieldCheck,
        title: "Security",
        description: "The property has a security guard. Please ensure all doors and windows are locked when you leave. Report any security concerns to the host immediately.",
    },
    {
        icon: Trash2,
        title: "Cleanliness",
        description: "Please keep the property tidy during your stay. Dispose of trash in the designated bins. Leave the property in a reasonably clean state upon check-out.",
    },
    {
        icon: Key,
        title: "Keys & Access",
        description: (
            <>
                You will receive access instructions before check-in. Lost keys will incur a <span className="font-medium text-foreground">replacement fee</span>. Return all keys upon check-out.
            </>
        ),
    },
]

export default function HouseRulesPage() {
    return (
        <main className="min-h-screen">
            <Header />
            <div className="bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
                        House Rules
                    </h1>
                    <p className="text-muted-foreground text-lg mb-12">
                        To ensure a comfortable and enjoyable stay for all guests, please review and follow these house rules.
                    </p>

                    <div className="space-y-8">
                        {rules.map((rule) => (
                            <div key={rule.title} className="flex gap-5 pb-8 border-b border-border last:border-0">
                                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                                    <rule.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground text-lg mb-1">{rule.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{rule.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-muted rounded-2xl">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            By booking House by AD, you agree to abide by these house rules. Violation of any rules may result in immediate termination of your stay without refund. If you have any questions about these rules, please don&apos;t hesitate to contact your host before booking.
                        </p>
                    </div>

                    <ReadingNavigation
                        prev={{
                            href: "/cancellation-policy",
                            title: "Cancellation Policy",
                            description: "Need to review our refund and cancellation terms? Head back here.",
                        }}
                    />
                </div>
            </div>
            <Footer />
        </main>
    )
}
