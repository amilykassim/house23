import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy | Casamigo",
    description: "Privacy policy for Casamigo. Learn how we handle your personal information.",
}

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen">
            <Header />
            <div className="bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-muted-foreground text-lg mb-2">
                        Your privacy matters to us. This policy explains how we collect, use, and protect your information.
                    </p>
                    <p className="text-sm text-muted-foreground mb-12">
                        Last updated: March 31, 2026
                    </p>

                    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                1. Information We Collect
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                When you interact with Casamigo, we may collect the following types of information:
                            </p>
                            <ul className="text-muted-foreground space-y-2 leading-relaxed">
                                <li><span className="font-medium text-foreground">Contact Information</span> — Name, email address, and phone number provided when you make a booking inquiry or contact the host.</li>
                                <li><span className="font-medium text-foreground">Booking Details</span> — Dates of stay, number of guests, and special requests.</li>
                                <li><span className="font-medium text-foreground">Usage Data</span> — Information about how you use our website, including pages visited, time spent, and browser type (collected via analytics tools).</li>
                                <li><span className="font-medium text-foreground">Communication Data</span> — Messages exchanged with the host through the website or messaging platforms.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                2. How We Use Your Information
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                We use the information we collect to:
                            </p>
                            <ul className="text-muted-foreground space-y-2 leading-relaxed">
                                <li>Process and manage your booking</li>
                                <li>Communicate with you about your stay</li>
                                <li>Provide check-in instructions and property details</li>
                                <li>Improve our website and guest experience</li>
                                <li>Respond to inquiries and support requests</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                3. Information Sharing
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We do <span className="font-medium text-foreground">not</span> sell, rent, or trade your personal information to third parties. We may share your information only in the following circumstances:
                            </p>
                            <ul className="text-muted-foreground space-y-2 leading-relaxed mt-3">
                                <li><span className="font-medium text-foreground">Service Providers</span> — With trusted third-party services (e.g., Airbnb, analytics tools) that help us operate and improve our services.</li>
                                <li><span className="font-medium text-foreground">Legal Requirements</span> — When required by law, regulation, or legal process.</li>
                                <li><span className="font-medium text-foreground">Safety</span> — To protect the safety, rights, or property of our guests, host, or others.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                4. Cookies & Analytics
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Our website may use cookies and similar technologies to enhance your browsing experience. We use Vercel Analytics to understand how visitors interact with our site. These tools collect anonymized data and do not personally identify you. You can disable cookies in your browser settings, though some website features may be affected.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                5. Data Security
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We take reasonable measures to protect your personal information from unauthorized access, alteration, or destruction. However, no method of transmission over the internet is 100% secure. We encourage you to take steps to protect your own information, such as using strong passwords and keeping your login credentials confidential.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                6. Data Retention
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Booking-related data is retained for a reasonable period after your stay for reference and legal compliance.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                7. Your Rights
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                Depending on your location, you may have the right to:
                            </p>
                            <ul className="text-muted-foreground space-y-2 leading-relaxed">
                                <li>Access the personal information we hold about you</li>
                                <li>Request correction of inaccurate information</li>
                                <li>Request deletion of your personal data</li>
                                <li>Opt out of marketing communications</li>
                            </ul>
                            <p className="text-muted-foreground leading-relaxed mt-3">
                                To exercise any of these rights, please contact us at hello@Casamigo.com.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                8. Third-Party Links
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Our website may contain links to third-party websites (e.g., Airbnb, social media platforms). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                9. Changes to This Policy
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Your continued use of our website after changes are posted constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-serif text-xl font-semibold text-foreground mb-3">
                                10. Contact Us
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions or concerns about this Privacy Policy, please contact us at:
                            </p>
                            <div className="mt-3 p-6 bg-muted rounded-2xl">
                                <p className="text-foreground font-medium">Casamigo</p>
                                <p className="text-muted-foreground text-sm mt-1">Email: hello@Casamigo.com</p>
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
