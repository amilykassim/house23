"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Toaster } from "sonner"
import {
    LayoutDashboard,
    CalendarDays,
    BookOpen,
    ChevronLeft,
    Menu,
    Home,
    Moon,
    Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
    { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border
                    flex flex-col transition-transform duration-300 ease-in-out
                    lg:translate-x-0 lg:static lg:z-auto lg:h-screen lg:sticky lg:top-0
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Logo */}
                <div className="px-6 py-5 border-b border-border">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                            <span className="text-background font-bold text-sm">AD</span>
                        </div>
                        <div>
                            <h1 className="font-serif text-base font-semibold text-foreground leading-tight">
                                House by AD
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Admin Panel
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/admin"
                                ? pathname === "/admin"
                                : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                                    ${isActive
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }
                                `}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom actions */}
                <div className="px-3 py-4 border-t border-border space-y-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <Home className="h-4 w-4" />
                        Back to Website
                    </Link>
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-4 w-4" />
                            ) : (
                                <Moon className="h-4 w-4" />
                            )}
                            {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </button>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    >
                        <Menu className="h-5 w-5 text-foreground" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
                            <span className="text-background font-bold text-[10px]">AD</span>
                        </div>
                        <span className="font-serif text-sm font-semibold text-foreground">
                            Admin
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1">{children}</main>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        className: "!bg-card !text-foreground !border-border",
                    }}
                />
            </div>
        </div>
    )
}
