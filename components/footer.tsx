"use client"

import Link from "next/link"
import { Instagram, Facebook, Mail, Phone } from "lucide-react"

const footerLinks = [
  {
    title: "Explore",
    links: [
      { label: "Photos", href: "#photos" },
      { label: "Amenities", href: "#amenities" },
      { label: "Reviews", href: "#reviews" },
      { label: "Location", href: "#location" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "House Rules", href: "#" },
      { label: "Cancellation Policy", href: "#" },
      { label: "Check-in / Check-out", href: "#" },
      { label: "Safety & Property", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Host", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Report Issue", href: "#" },
    ],
  },
]

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Mail, href: "mailto:hello@Casamigo.com", label: "Email" },
]

export function Footer() {
  return (
    <footer className="bg-muted text-foreground dark:bg-card dark:text-card-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-serif text-2xl font-semibold mb-4">Casamigo</h3>
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
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground dark:text-card-foreground/70 hover:text-foreground dark:hover:text-card-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-foreground/10 dark:border-card-foreground/10 mb-8">
          <div className="flex items-center gap-6">
            <a href="mailto:hello@Casamigo.com" className="flex items-center gap-2 text-muted-foreground dark:text-card-foreground/70 hover:text-foreground dark:hover:text-card-foreground transition-colors">
              <Mail className="h-4 w-4" />
              <span className="text-sm">hello@Casamigo.com</span>
            </a>
            <a href="tel:+1-310-555-0123" className="flex items-center gap-2 text-muted-foreground dark:text-card-foreground/70 hover:text-foreground dark:hover:text-card-foreground transition-colors">
              <Phone className="h-4 w-4" />
              <span className="text-sm">+(250) 788-123-456</span>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-foreground/10 dark:border-card-foreground/10">
          <p className="text-muted-foreground/60 dark:text-card-foreground/60 text-sm">
            2026 Casamigo. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground/60 dark:text-card-foreground/60 hover:text-muted-foreground dark:hover:text-card-foreground transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="#" className="text-muted-foreground/60 dark:text-card-foreground/60 hover:text-muted-foreground dark:hover:text-card-foreground transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
