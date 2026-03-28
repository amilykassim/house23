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
  { icon: Mail, href: "mailto:hello@casaserena.com", label: "Email" },
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-serif text-2xl font-semibold mb-4">House 23</h3>
            <p className="text-background/70 text-sm leading-relaxed mb-6">
              Your private home in Kigali. Experience luxury, comfort, and breathtaking views.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
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
                      className="text-background/70 hover:text-background transition-colors text-sm"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-background/20 mb-8">
          <div className="flex items-center gap-6">
            <a href="mailto:hello@casaserena.com" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors">
              <Mail className="h-4 w-4" />
              <span className="text-sm">hello@casaserena.com</span>
            </a>
            <a href="tel:+1-310-555-0123" className="flex items-center gap-2 text-background/70 hover:text-background transition-colors">
              <Phone className="h-4 w-4" />
              <span className="text-sm">+1 (310) 555-0123</span>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-background/20">
          <p className="text-background/50 text-sm">
            2026 House 23. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-background/50 hover:text-background/70 transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="#" className="text-background/50 hover:text-background/70 transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
