"use client"

import Link from "next/link"
import { Instagram, Mail, Phone } from "lucide-react"

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.28 8.28 0 004.77 1.52V6.93a4.85 4.85 0 01-1-.24z" />
    </svg>
  )
}

const footerLinks = [
  {
    title: "Explore",
    links: [
      { label: "Photos", href: "/house/house-23#photos" },
      { label: "Amenities", href: "/house/house-23#amenities" },
      { label: "Reviews", href: "/house/house-23#reviews" },
      { label: "Location", href: "/house/house-23#location" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Check-in / Check-out", href: "/check-in-check-out" },
      { label: "House Guide", href: "/house-guide" },
      { label: "House Rules", href: "/house-rules" },
      { label: "Cancellation Policy", href: "/cancellation-policy" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Host", href: "https://wa.me/250788459885" },
      { label: "FAQ", href: "/faq" },
    ],
  },
]

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: TikTokIcon, href: "#", label: "TikTok" },
  { icon: Mail, href: "mailto:hello@House by AD.com", label: "Email" },
]

export function Footer() {
  return (
    <footer className="bg-muted text-foreground dark:bg-card dark:text-card-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-serif text-2xl font-semibold mb-4">House by AD</h3>
            <p className="text-muted-foreground dark:text-card-foreground/70 text-sm leading-relaxed mb-6">
              Your private home in Kigali. Experience luxury, comfort, and breathtaking views.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-foreground/10 dark:bg-card-foreground/10 flex items-center justify-center hover:bg-foreground/20 dark:hover:bg-card-foreground/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold mb-4">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => {
                  const isExternal = link.href.startsWith("http")
                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground dark:text-card-foreground/70 hover:text-foreground dark:hover:text-card-foreground transition-colors text-sm"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-muted-foreground dark:text-card-foreground/70 hover:text-foreground dark:hover:text-card-foreground transition-colors text-sm"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-foreground/10 dark:border-card-foreground/10 mb-8">
          <div className="flex items-center gap-6">
            <a href="mailto:hello@House by AD.com" className="flex items-center gap-2 text-muted-foreground dark:text-card-foreground/70 hover:text-foreground dark:hover:text-card-foreground transition-colors">
              <Mail className="h-4 w-4" />
              <span className="text-sm">hello@House by AD.com</span>
            </a>
            <a href="tel:+250788459885" className="flex items-center gap-2 text-muted-foreground dark:text-card-foreground/70 hover:text-foreground dark:hover:text-card-foreground transition-colors">
              <Phone className="h-4 w-4" />
              <span className="text-sm">+(250) 788-459-885</span>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-foreground/10 dark:border-card-foreground/10">
          <p className="text-muted-foreground/60 dark:text-card-foreground/60 text-sm">
            2026 House by AD. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="text-muted-foreground/60 dark:text-card-foreground/60 hover:text-muted-foreground dark:hover:text-card-foreground transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-muted-foreground/60 dark:text-card-foreground/60 hover:text-muted-foreground dark:hover:text-card-foreground transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
