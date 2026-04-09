"use client"

import { PricingManager } from "@/components/pricing-manager"
import { GuideAccessManager } from "@/components/guide-access-manager"

export default function AdminListingPage() {
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-1">
                    Listing
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage pricing and house guide access
                </p>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pricing Manager */}
                <div className="lg:col-span-2">
                    <PricingManager />
                </div>

                {/* Guide Access Manager */}
                <div className="lg:col-span-2">
                    <GuideAccessManager />
                </div>
            </div>
        </div>
    )
}
