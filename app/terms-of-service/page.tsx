import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Terms of Service | Velstays",
    description: "Terms and conditions for booking and staying at Velstays.",
}

export default function TermsOfServicePage() {
    return (
        <main className="min-h-screen">
            <Header />
            <div className="bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-muted-foreground text-lg mb-2">
                        Please read these terms carefully before booking or using our services.
                    </p>
                    <p className="text-sm text-muted-foreground mb-12">
                        Last updated: March 31, 2026
                    </p>

                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing our website or booking a stay at Velstays, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website or services.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                2. The Property
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Velstays operates short-term vacation rental properties in Kigali, Rwanda. The property descriptions, photos, and amenities listed on our website are accurate representations. Minor variations may occur due to seasonal maintenance or updates.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                3. Booking & Reservations
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                Bookings are made through our Airbnb listing or by contacting the host directly. By completing a reservation, you agree to:
                            </p>
                            <ul className="text-muted-foreground space-y-2 leading-relaxed">
                                <li>Provide accurate personal information</li>
                                <li>Pay the full booking amount as specified</li>
                                <li>Abide by the house rules and all applicable policies</li>
                                <li>Use the property solely for its intended purpose as a short-term vacation rental</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                4. Guest Responsibilities
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                As a guest, you are responsible for:
                            </p>
                            <ul className="text-muted-foreground space-y-2 leading-relaxed">
                                <li>Treating the property with care and respect</li>
                                <li>Following the house rules throughout your stay</li>
                                <li>Ensuring that all members of your party comply with these terms</li>
                                <li>Reporting any damage, maintenance issues, or safety concerns to the host immediately</li>
                                <li>Using all appliances, furniture, and amenities as intended</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                5. Payments & Pricing
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                All prices are listed in USD and include the nightly rate and applicable fees. Payments are processed securely through the Airbnb platform. We reserve the right to update pricing at any time, but confirmed bookings will be honored at the agreed-upon rate.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                6. Cancellation & Refunds
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Cancellations are subject to our Cancellation Policy. Refunds are processed according to the timeline outlined in that policy. For bookings made through Airbnb, the platform&apos;s resolution policies may also apply.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                7. Damages & Liability
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                Guests are liable for any damage to the property, furnishings, or amenities caused during their stay. This includes:
                            </p>
                            <ul className="text-muted-foreground space-y-2 leading-relaxed">
                                <li>Physical damage to the property or its contents</li>
                                <li>Excessive cleaning required beyond normal use</li>
                                <li>Loss or theft of property items (e.g., keys, linens, appliances)</li>
                                <li>Damage caused by unauthorized guests or visitors</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-3">
                                The host reserves the right to charge for repairs or replacements. For Airbnb bookings, claims may be processed through Airbnb&apos;s AirCover for Hosts program.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                8. Limitation of Liability
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Velstays and its host are not liable for any personal injury, illness, loss, or damage to personal belongings during your stay, except where caused by proven negligence on our part. Guests stay at their own risk and are encouraged to carry appropriate travel and health insurance.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                9. House Rules
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                All guests must comply with the house rules, which form part of these Terms of Service. Violation of house rules may result in termination of your stay without refund. The complete house rules are available on our House Rules page.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                10. Intellectual Property
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                All content on this website — including text, images, design, and branding — is the property of Velstays and is protected by copyright. You may not reproduce, distribute, or use any content without prior written permission.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                11. Privacy
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Your use of our website and services is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                12. Governing Law
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                These Terms of Service are governed by the laws of the Republic of Rwanda. Any disputes arising from these terms shall be resolved through amicable negotiation or, if necessary, through the courts of Kigali, Rwanda.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                13. Changes to Terms
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We reserve the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated date. Continued use of our services after changes constitutes acceptance of the revised terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                14. Contact
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                For questions about these Terms of Service, please contact us:
                            </p>
                            <div className="mt-3 p-6 bg-muted rounded-2xl">
                                <p className="text-foreground font-medium">Velstays</p>
                                <p className="text-muted-foreground text-sm mt-1">Email: hello@velstays.com</p>
                                <p className="text-muted-foreground text-sm">Location: Kicukiro, Kigali, Rwanda</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    )
}
