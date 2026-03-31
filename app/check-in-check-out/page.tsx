import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LogIn, LogOut, Clock, MessageSquare, Luggage, Info } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Check-in & Check-out | Casamigo",
    description: "Everything you need to know about checking in and out of Casamigo.",
}

export default function CheckInCheckOutPage() {
    return (
        <main className="min-h-screen">
            <Header />
            <div className="bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
                        Check-in & Check-out
                    </h1>
                    <p className="text-muted-foreground text-lg mb-12">
                        Everything you need for a smooth arrival and departure at Casamigo.
                    </p>

                    {/* Check-in Section */}
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <LogIn className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Check-in</h2>
                        </div>

                        <div className="space-y-6 pl-4 border-l-2 border-green-200 dark:border-green-800 ml-6">
                            <div className="pl-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-foreground">Check-in Time</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    Check-in is available from <span className="font-semibold text-foreground">2:00 PM </span> onwards. If you need an early check-in, please contact the host in advance — we&apos;ll do our best to accommodate your schedule.
                                </p>
                            </div>

                            <div className="pl-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-foreground">How It Works</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    You will receive detailed check-in instructions (including directions) via message 24 hours before your arrival. Our security guard will be on-site to welcome you and help with your luggage.
                                </p>
                            </div>

                            <div className="pl-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-foreground">What to Expect on Arrival</h3>
                                </div>
                                <ul className="text-muted-foreground space-y-2 leading-relaxed">
                                    <li>• A clean, freshly prepared home ready for your stay</li>
                                    <li>• Fresh towels and bed linens</li>
                                    <li>• A welcome note with Wi-Fi details</li>
                                    <li>• Complimentary refreshments</li>
                                    <li>• A walkthrough of the property (if needed)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Check-out Section */}
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <LogOut className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h2 className="font-serif text-2xl font-semibold text-foreground">Check-out</h2>
                        </div>

                        <div className="space-y-6 pl-4 border-l-2 border-orange-200 dark:border-orange-800 ml-6">
                            <div className="pl-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-foreground">Check-out Time</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    Check-out is by <span className="font-semibold text-foreground">11:00 AM</span>. Late check-out may be available upon request, subject to the next guest&apos;s arrival schedule.
                                </p>
                            </div>

                            <div className="pl-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Luggage className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-foreground">Before You Leave</h3>
                                </div>
                                <ul className="text-muted-foreground space-y-2 leading-relaxed">
                                    <li>• Please leave used towels in the bathroom</li>
                                    <li>• Dispose of any perishable food</li>
                                    <li>• Turn off all lights and fans</li>
                                    <li>• Ensure all windows and doors are closed and locked</li>
                                    <li>• Return all keys to the designated spot</li>
                                    <li>• Take all your personal belongings with you</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Late check-in / check-out */}
                    <div className="rounded-2xl border border-border p-8 mb-12">
                        <h3 className="font-semibold text-foreground text-lg mb-3">Flexible Timing?</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            We understand that travel schedules can be unpredictable. If you need early check-in or late check-out, simply send us a message as early as possible. We&apos;ll do our best to accommodate your request at no extra charge, depending on availability.
                        </p>
                    </div>

                    <div className="p-6 bg-muted rounded-2xl">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            If you have a late-night arrival or early-morning flight, let us know and we&apos;ll arrange for our security guard to assist you. Your comfort and safety are our priority.
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    )
}
