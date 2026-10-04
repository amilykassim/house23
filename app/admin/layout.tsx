"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus_Jakarta_Sans } from "next/font/google"

import {
    LayoutDashboard,
    CalendarDays,
    BookOpen,
    ClipboardList,
    CirclePlus,
    Receipt,
    TrendingUp,
    Home,
    Menu,
    X,
} from "lucide-react"

// The back office uses its own face; overriding --font-sans re-points every
// font utility inside the admin shell.
const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-sans",
    display: "swap",
})

const navItems = [
    { href: "/admin/insights", label: "Insights", icon: TrendingUp, exact: false },
    { href: "/admin/add", label: "Add booking", icon: CirclePlus, exact: false },
    { href: "/admin/expenses", label: "Expenses", icon: Receipt, exact: false },
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/bookings", label: "Bookings", icon: BookOpen, exact: false },
    { href: "/admin/calendar", label: "Calendar", icon: CalendarDays, exact: false },
    { href: "/admin/listing", label: "Listing", icon: ClipboardList, exact: false },
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
        <div className={`${jakarta.variable} font-sans min-h-screen bg-background text-foreground flex flex-col`}>
            {/* Header — matches website header design */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 border-b border-[#EBEBEB] bg-background/90 transition-all duration-300 ${scrolled ? "backdrop-blur-lg" : "backdrop-blur-md"}`}
            >
                <div className="px-4 sm:px-6">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/admin/insights" className="flex items-center gap-2">
                            <span className="text-[22px] font-bold tracking-[-0.02em] text-foreground">
                                Velstays
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={`px-3.5 py-2.5 rounded-full text-sm transition-colors ${isActive
                                            ? "bg-muted font-semibold text-foreground"
                                            : "font-medium text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Right actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Website
                            </Link>
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
