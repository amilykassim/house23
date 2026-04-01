"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

const faqCategories = [
    {
        title: "Booking & Reservations",
        faqs: [
            {
                question: "How do I book House by AD?",
                answer:
                    "You can book directly through our Airbnb listing or contact the host via the booking card on this website. Simply select your dates, number of guests, and complete the reservation process.",
            },
            {
                question: "What is the minimum stay?",
                answer:
                    "The minimum stay is 1 night. However, we recommend at least 2–3 nights to fully enjoy the property and explore Kigali.",
            },
            {
                question: "How far in advance should I book?",
                answer:
                    "We recommend booking at least a few days in advance, especially during peak travel seasons. Last-minute bookings are sometimes possible — just message the host to check availability.",
            },
            {
                question: "Can I extend my stay after checking in?",
                answer:
                    "Yes, subject to availability. Simply contact the host as soon as possible, and we'll accommodate your request if there are no conflicting bookings.",
            },
        ],
    },
    {
        title: "The Property",
        faqs: [
            {
                question: "How many guests can the property accommodate?",
                answer:
                    "House by AD House 23 comfortably accommodates up to 3 guests with 2 bedrooms, 2 beds, and 2 bathrooms.",
            },
            {
                question: "Is Wi-Fi available?",
                answer:
                    "Yes! High-speed Wi-Fi is available throughout the property, perfect for remote work or streaming. The Wi-Fi details will be provided upon check-in.",
            },
            {
                question: "Is there parking available?",
                answer:
                    "Yes, free on-premises parking is available for guests. The property has a secure parking area within the compound.",
            },
            {
                question: "Does the property have a workspace?",
                answer:
                    "Yes, the property includes a dedicated home office/workspace, making it ideal for remote workers and digital nomads.",
            },
            {
                question: "Is the property suitable for children?",
                answer:
                    "Children are welcome but must be supervised at all times. The property is not fully childproofed, so families with very young children should take extra precautions.",
            },
        ],
    },
    {
        title: "Check-in & Check-out",
        faqs: [
            {
                question: "What are the check-in and check-out times?",
                answer:
                    "Check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out may be arranged depending on availability — just ask!",
            },
            {
                question: "How do I access the property?",
                answer:
                    "You'll receive detailed check-in instructions including directions and access information 24 hours before your arrival. Our security guard will be on-site to welcome you.",
            },
            {
                question: "Can I check in late at night?",
                answer:
                    "Absolutely. Late check-ins are welcome. Just let the host know your estimated arrival time, and our security guard will be available to let you in.",
            },
        ],
    },
    {
        title: "Location & Transportation",
        faqs: [
            {
                question: "Where is the property located?",
                answer:
                    "House by AD House 23 is located in Kicukiro, Kigali, Rwanda — a peaceful residential neighborhood with easy access to the city center, restaurants, and coffee shops.",
            },
            {
                question: "How do I get around Kigali?",
                answer:
                    "Kigali has reliable taxi (Move Rides) and moto (YegoMoto) services. We recommend using ride-hailing apps like Yego Moto or Move. The host can also help arrange reliable transportation, including airport transfers.",
            },
            {
                question: "How far is the property from the airport?",
                answer:
                    "Kigali International Airport is approximately 15–20 minutes away by car, depending on traffic conditions.",
            },
            {
                question: "Are there restaurants and shops nearby?",
                answer:
                    "Yes! There are excellent restaurants and coffee shops within a short drive. The host provides a list of recommended places upon check-in.",
            },
        ],
    },
    {
        title: "Payments & Cancellations",
        faqs: [
            {
                question: "What payment methods are accepted?",
                answer:
                    "If you’re booking through our website, you can conveniently pay using our MoMo Code. Alternatively, if you’re booking via Airbnb, the platform supports major credit cards, debit cards, and other payment methods depending on your region.",
            },
            {
                question: "What is the cancellation policy?",
                answer:
                    "Free cancellation up to 7 days before check-in for a full refund. Cancellations between 3–7 days receive a 50% refund. Less than 3 days or no-shows are non-refundable. Visit our Cancellation Policy page for full details.",
            },
            {
                question: "Is there a cleaning fee?",
                answer:
                    "Yes, a one-time cleaning fee of $10 is applied to each booking to ensure the property is thoroughly cleaned and prepared for your arrival.",
            },
            {
                question: "Are there any hidden fees?",
                answer:
                    "No hidden fees. Your booking total includes the nightly rate, cleaning fee, and any applicable service fees. Everything is transparent at the time of booking.",
            },
        ],
    },
    {
        title: "Safety & Security",
        faqs: [
            {
                question: "Is the neighborhood safe?",
                answer:
                    "Yes, House by AD is located in a very safe, quiet, and secure residential neighborhood. Rwanda is widely recognized as one of the safest countries in Africa.",
            },
            {
                question: "Is there security on the property?",
                answer:
                    "Yes, a dedicated security guard is on-site to ensure your safety. The property also has secure walls and locked gates.",
            },
            {
                question: "What should I do in case of an emergency?",
                answer:
                    "Contact the host immediately. Emergency numbers and local hospital information will be provided in your welcome guide upon check-in.",
            },
        ],
    },
]

export default function FAQPage() {
    return (
        <main className="min-h-screen">
            <Header />
            <div className="bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <HelpCircle className="h-8 w-8 text-primary" />
                        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground">
                            FAQ
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg mb-12">
                        Find answers to common questions about staying at House by AD. Can&apos;t find what you&apos;re looking for? Contact the host directly.
                    </p>

                    <div className="space-y-12">
                        {faqCategories.map((category) => (
                            <div key={category.title}>
                                <h2 className="font-serif text-xl font-semibold text-foreground mb-4">
                                    {category.title}
                                </h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {category.faqs.map((faq, index) => (
                                        <AccordionItem key={index} value={`${category.title}-${index}`}>
                                            <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-muted rounded-2xl text-center">
                        <h3 className="font-semibold text-foreground mb-2">Still have questions?</h3>
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t hesitate to reach out to your host. We&apos;re always happy to help and make sure your stay is perfect.
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    )
}
