"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Home, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/animated-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { houses, DEFAULT_HOUSE_SLUG } from "@/lib/houses"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const sectionLinks = [
  { href: "#photos", label: "Photos" },
  { href: "#amenities", label: "Amenities" },
  { href: "#reviews", label: "Reviews" },
  { href: "#location", label: "Location" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Determine the active house from the URL, default to House 23
  const activeHouse = houses.find((h) => pathname.includes(h.slug)) ?? houses.find((h) => h.slug === DEFAULT_HOUSE_SLUG)!

  // On booking page, window doesn't scroll (content scrolls in inner div),
  // so always show the "scrolled" header style to keep it visible
  const showScrolledStyle = scrolled || pathname.startsWith("/book/")

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${showScrolledStyle
        ? "bg-background/50 backdrop-blur-lg border-border/50"
        : "bg-background/80 backdrop-blur-md border-transparent"
        }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Velstays
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Houses Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus:outline-none focus-visible:outline-none">
                  <Home className="h-4 w-4" />
                  <span>{activeHouse.name}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={12} className="w-48">
                {houses.map((house) => (
                  <DropdownMenuItem key={house.slug} asChild className="focus:bg-primary/10 focus:text-foreground">
                    <Link
                      href={`/house/${house.slug}`}
                      className={activeHouse.slug === house.slug ? "font-semibold text-primary" : ""}
                    >
                      {house.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="h-4 w-px bg-border" />

            {/* Section Links */}
            {sectionLinks.map((link) => (
              <Link
                key={link.href}
                href={`/house/${activeHouse.slug}${link.href}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {!pathname.startsWith("/book/") && (
              <AnimatedButton
                size="lg"
                className="rounded-full px-6"
                hoverText="Let's go ✦"
                onClick={() => {
                  const el = document.getElementById("booking")
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                }}
              >
                Book a stay
              </AnimatedButton>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-4 py-4 space-y-1">
            {/* Houses */}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2 pb-1">
              Our Houses
            </p>
            {houses.map((house) => (
              <Link
                key={house.slug}
                href={`/house/${house.slug}`}
                className={`block text-base font-medium transition-colors py-2 px-2 rounded-lg ${activeHouse.slug === house.slug
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {house.name}
              </Link>
            ))}

            <div className="border-t border-border my-3" />

            {/* Section Links */}
            {sectionLinks.map((link) => (
              <Link
                key={link.href}
                href={`/house/${activeHouse.slug}${link.href}`}
                className="block text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Theme toggle for mobile */}
            <div className="px-2 pt-2">
              <ThemeToggle />
            </div>

            {!pathname.startsWith("/book/") && (
              <div className="pt-3">
                <AnimatedButton
                  size="lg"
                  className="w-full rounded-full"
                  hoverText="Let's go ✦"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    const el = document.getElementById("booking")
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  }}
                >
                  Book a stay
                </AnimatedButton>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
