import Link from "next/link"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"

interface ReadingLink {
    href: string
    title: string
    description: string
}

interface ReadingNavigationProps {
    prev?: ReadingLink
    next?: ReadingLink
}

export function ReadingNavigation({ prev, next }: ReadingNavigationProps) {
    return (
        <div className="mt-12">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Continue reading
                </span>
            </div>
            <div className={`grid gap-4 ${prev && next ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                {prev && (
                    <Link
                        href={prev.href}
                        className="group relative flex flex-col justify-between rounded-2xl border border-border p-6 transition-all hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm"
                    >
                        <div>
                            <span className="text-xs font-medium text-muted-foreground mb-2 block">
                                ← Previous
                            </span>
                            <h4 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                                {prev.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {prev.description}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 mt-4 text-primary transition-transform duration-200 group-hover:-translate-x-1">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">Read</span>
                        </div>
                    </Link>
                )}
                {next && (
                    <Link
                        href={next.href}
                        className={`group relative flex flex-col justify-between rounded-2xl border border-border p-6 transition-all hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm ${!prev ? "sm:col-span-1" : ""}`}
                    >
                        <div>
                            <span className="text-xs font-medium text-muted-foreground mb-2 block text-right">
                                Up next →
                            </span>
                            <h4 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2 text-right">
                                {next.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed text-right">
                                {next.description}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 mt-4 text-primary transition-transform duration-200 group-hover:translate-x-1 justify-end">
                            <span className="text-sm font-medium">Read</span>
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </Link>
                )}
            </div>
        </div>
    )
}
