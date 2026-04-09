"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    KeyRound,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    Phone,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Smartphone,
} from "lucide-react"
import { toast } from "sonner"

interface GuideAccessEntry {
    code: string
    label: string
    source: "manual" | "booking"
    bookingId?: string
    createdAt: string
}

export function GuideAccessManager() {
    const [entries, setEntries] = useState<GuideAccessEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [newCode, setNewCode] = useState("")
    const [newLabel, setNewLabel] = useState("")
    const [addError, setAddError] = useState("")
    const [addLoading, setAddLoading] = useState(false)
    const [editingCode, setEditingCode] = useState<string | null>(null)
    const [editLabel, setEditLabel] = useState("")
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [deleteLoading, setDeleteLoading] = useState(false)
    const codeInputRef = useRef<HTMLInputElement>(null)

    const fetchEntries = async () => {
        try {
            const res = await fetch("/api/guide-access")
            const data = await res.json()
            setEntries(data.entries || [])
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEntries()
    }, [])

    const handleAdd = async () => {
        const cleaned = newCode.replace(/\D/g, "").slice(-4)
        if (cleaned.length !== 4) {
            setAddError("Enter exactly 4 digits")
            return
        }

        if (!newLabel.trim()) {
            setAddError("Guest name is required")
            return
        }

        setAddLoading(true)
        setAddError("")

        try {
            const res = await fetch("/api/guide-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: cleaned, label: newLabel.trim() }),
            })

            if (res.ok) {
                setNewCode("")
                setNewLabel("")
                setAdding(false)
                fetchEntries()
                toast("Access code added", {
                    icon: "🔑",
                    description: `Code ${cleaned} is now active`,
                    duration: 3000,
                    unstyled: true,
                    classNames: {
                        toast: "w-full flex items-start gap-3 bg-green-500/10 border border-green-200/60 dark:border-green-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                        icon: "text-2xl mt-0.5 shrink-0",
                        title: "font-semibold text-green-800 dark:text-green-200 text-sm",
                        description: "text-xs text-green-700/70 dark:text-green-300/70 mt-0.5",
                    },
                })
            } else {
                const data = await res.json()
                setAddError(data.error || "Failed to add")
            }
        } catch {
            setAddError("Something went wrong")
        } finally {
            setAddLoading(false)
        }
    }

    const handleEdit = async (code: string) => {
        try {
            const res = await fetch("/api/guide-access", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, label: editLabel.trim() }),
            })
            if (res.ok) {
                setEditingCode(null)
                fetchEntries()
                toast("Label updated", {
                    icon: "✏️",
                    duration: 2000,
                    unstyled: true,
                    classNames: {
                        toast: "w-full flex items-start gap-3 bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                        icon: "text-xl mt-0.5 shrink-0",
                        title: "font-semibold text-blue-800 dark:text-blue-200 text-sm",
                    },
                })
            }
        } catch {
            // ignore
        }
    }

    const handleDelete = async (code: string) => {
        try {
            await fetch(`/api/guide-access?code=${code}`, { method: "DELETE" })
            fetchEntries()
            setSelected((prev) => {
                const next = new Set(prev)
                next.delete(code)
                return next
            })
            toast("Code removed", {
                icon: "🗑️",
                duration: 2000,
                unstyled: true,
                classNames: {
                    toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                    icon: "text-xl mt-0.5 shrink-0",
                    title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                },
            })
        } catch {
            // ignore
        }
    }

    const handleBulkDelete = async () => {
        if (selected.size === 0) return
        setDeleteLoading(true)

        try {
            const codes = Array.from(selected).join(",")
            await fetch(`/api/guide-access?codes=${codes}`, { method: "DELETE" })
            setSelected(new Set())
            fetchEntries()
            toast(`${selected.size} code${selected.size > 1 ? "s" : ""} removed`, {
                icon: "🗑️",
                duration: 2000,
                unstyled: true,
                classNames: {
                    toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                    icon: "text-xl mt-0.5 shrink-0",
                    title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                },
            })
        } catch {
            // ignore
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleDeleteAll = async () => {
        setDeleteLoading(true)
        try {
            await fetch(`/api/guide-access?all=true`, { method: "DELETE" })
            setSelected(new Set())
            fetchEntries()
            toast("All codes removed", {
                icon: "🗑️",
                duration: 2000,
                unstyled: true,
                classNames: {
                    toast: "w-full flex items-start gap-3 bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-xl p-4 shadow-lg backdrop-blur-sm",
                    icon: "text-xl mt-0.5 shrink-0",
                    title: "font-semibold text-red-800 dark:text-red-200 text-sm",
                },
            })
        } catch {
            // ignore
        } finally {
            setDeleteLoading(false)
        }
    }

    const toggleSelect = (code: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(code)) next.delete(code)
            else next.add(code)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selected.size === entries.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(entries.map((e) => e.code)))
        }
    }

    const manualEntries = entries.filter((e) => e.source === "manual")
    const bookingEntries = entries.filter((e) => e.source === "booking")

    return (
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <KeyRound className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-foreground">House Guide Access</h2>
                        <p className="text-xs text-muted-foreground">
                            Manage who can access the house guide
                        </p>
                    </div>
                </div>
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full">
                    {entries.length} active
                </span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Action bar */}
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => {
                                setAdding(true)
                                setTimeout(() => codeInputRef.current?.focus(), 100)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Code
                        </button>

                        {selected.size > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2"
                            >
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={deleteLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete ({selected.size})
                                </button>
                            </motion.div>
                        )}

                        {entries.length > 1 && (
                            <div className="ml-auto flex items-center gap-2">
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {selected.size === entries.length ? "Deselect all" : "Select all"}
                                </button>
                                {entries.length > 0 && (
                                    <button
                                        onClick={handleDeleteAll}
                                        disabled={deleteLoading}
                                        className="text-[10px] font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                    >
                                        Delete all
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Add form */}
                    <AnimatePresence>
                        {adding && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 mb-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                                Last 4 digits *
                                            </label>
                                            <input
                                                ref={codeInputRef}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={4}
                                                value={newCode}
                                                onChange={(e) => {
                                                    setNewCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                                                    setAddError("")
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAdd()
                                                    if (e.key === "Escape") setAdding(false)
                                                }}
                                                placeholder="1234"
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono outline-none focus:border-violet-500/60 transition-colors"
                                            />
                                        </div>
                                        <div className="flex-2">
                                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                                                Guest Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={newLabel}
                                                onChange={(e) => setNewLabel(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleAdd()
                                                    if (e.key === "Escape") setAdding(false)
                                                }}
                                                placeholder="e.g. John Doe"
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-violet-500/60 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {addError && (
                                        <div className="flex items-center gap-1.5 text-xs text-red-500">
                                            <AlertCircle className="w-3 h-3" />
                                            {addError}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleAdd}
                                            disabled={addLoading || newCode.length !== 4 || !newLabel.trim()}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
                                        >
                                            {addLoading ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Check className="h-3.5 w-3.5" />
                                            )}
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAdding(false)
                                                setNewCode("")
                                                setNewLabel("")
                                                setAddError("")
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Entries list */}
                    {entries.length === 0 ? (
                        <div className="text-center py-8">
                            <Smartphone className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No access codes yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                                Add phone digits manually or accept a booking to auto-add
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {/* Booking auto-added entries */}
                            {bookingEntries.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                        From Accepted Bookings
                                    </p>
                                    {bookingEntries.map((entry) => (
                                        <EntryRow
                                            key={entry.code}
                                            entry={entry}
                                            selected={selected.has(entry.code)}
                                            editing={editingCode === entry.code}
                                            editLabel={editLabel}
                                            onToggleSelect={() => toggleSelect(entry.code)}
                                            onStartEdit={() => {
                                                setEditingCode(entry.code)
                                                setEditLabel(entry.label)
                                            }}
                                            onSaveEdit={() => handleEdit(entry.code)}
                                            onCancelEdit={() => setEditingCode(null)}
                                            onEditLabelChange={setEditLabel}
                                            onDelete={() => handleDelete(entry.code)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Manual entries */}
                            {manualEntries.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Phone className="w-3 h-3 text-violet-500" />
                                        Manually Added
                                    </p>
                                    {manualEntries.map((entry) => (
                                        <EntryRow
                                            key={entry.code}
                                            entry={entry}
                                            selected={selected.has(entry.code)}
                                            editing={editingCode === entry.code}
                                            editLabel={editLabel}
                                            onToggleSelect={() => toggleSelect(entry.code)}
                                            onStartEdit={() => {
                                                setEditingCode(entry.code)
                                                setEditLabel(entry.label)
                                            }}
                                            onSaveEdit={() => handleEdit(entry.code)}
                                            onCancelEdit={() => setEditingCode(null)}
                                            onEditLabelChange={setEditLabel}
                                            onDelete={() => handleDelete(entry.code)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function EntryRow({
    entry,
    selected,
    editing,
    editLabel,
    onToggleSelect,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onEditLabelChange,
    onDelete,
}: {
    entry: GuideAccessEntry
    selected: boolean
    editing: boolean
    editLabel: string
    onToggleSelect: () => void
    onStartEdit: () => void
    onSaveEdit: () => void
    onCancelEdit: () => void
    onEditLabelChange: (v: string) => void
    onDelete: () => void
}) {
    return (
        <motion.div
            layout
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                selected
                    ? "bg-violet-500/10 border border-violet-500/20"
                    : "bg-muted/30 border border-transparent hover:bg-muted/50"
            }`}
        >
            {/* Checkbox */}
            <button
                onClick={onToggleSelect}
                className={`w-4 h-4 rounded border-2 transition-all shrink-0 flex items-center justify-center ${
                    selected
                        ? "bg-violet-600 border-violet-600"
                        : "border-border hover:border-violet-400"
                }`}
            >
                {selected && <Check className="w-3 h-3 text-white" />}
            </button>

            {/* Code badge */}
            <div className="shrink-0 px-2.5 py-1 rounded-lg bg-foreground/5 border border-border/50">
                <span className="font-mono text-sm font-bold text-foreground tracking-wider">
                    {entry.code}
                </span>
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
                {editing ? (
                    <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => onEditLabelChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onSaveEdit()
                            if (e.key === "Escape") onCancelEdit()
                        }}
                        className="w-full px-2 py-0.5 rounded border border-violet-500/40 bg-background text-xs outline-none focus:border-violet-500"
                        autoFocus
                    />
                ) : (
                    <div>
                        <p className="text-xs text-foreground truncate">
                            {entry.label || <span className="text-muted-foreground italic">No label</span>}
                        </p>
                        {entry.bookingId && (
                            <p className="text-[10px] text-muted-foreground">{entry.bookingId}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Source badge */}
            <span
                className={`shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                    entry.source === "booking"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                }`}
            >
                {entry.source === "booking" ? "Auto" : "Manual"}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {editing ? (
                    <>
                        <button
                            onClick={onSaveEdit}
                            className="p-1 rounded-md hover:bg-green-500/10 text-green-600 dark:text-green-400 transition-colors"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onCancelEdit}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onStartEdit}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit label"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    )
}
