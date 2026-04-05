"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
    LayoutDashboard,
    CalendarDays,
    BookOpen,
    Home,
    Menu,
    X,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/bookings", label: "Bookings", icon: BookOpen, exact: false },
    { href: "/admin/calendar", label: "Calendar", icon: CalendarDays, exact: false },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header — matches website header design */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${scrolled
                    ? "bg-background/90 backdrop-blur-lg border-border"
                    : "bg-background/90 backdrop-blur-md border-border"
                    }`}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/admin" className="flex items-center gap-2">
                            <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                                Velstays
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            {navItems.map((item) => {
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Right actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/"
                                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Home className="h-4 w-4" />
                                Website
                            </Link>
                            <span className="h-4 w-px bg-border" />
                            <ThemeToggle />
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
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2 pb-1">
                                Admin
                            </p>
                            {navItems.map((item) => {
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 text-base font-medium transition-colors py-2 px-2 rounded-lg ${isActive
                                            ? "text-foreground bg-muted"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                )
                            })}

                                {/* Theme toggle for mobile */}
                                <div className="px-2 pt-2">
                                    <ThemeToggle />
                                </div>

                                <div className="border-t border-border my-3" />

                            <Link
                                href="/"
                                className="flex items-center gap-3 text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-lg hover:bg-muted/50"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Home className="h-4 w-4" />
                                Back to Website
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Page content — offset for fixed header */}
            <main className="flex-1 pt-16">{children}</main>
        </div>
    )
}
