"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Lock, AlertCircle, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react"

interface GuideAccessModalProps {
    onSuccess: (guestName: string) => void
}

export function GuideAccessModal({ onSuccess }: GuideAccessModalProps) {
    const [code, setCode] = useState(["", "", "", ""])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [shake, setShake] = useState(false)
    const [showCode, setShowCode] = useState(false)
    const [success, setSuccess] = useState(false)
    const [guestName, setGuestName] = useState("")
    const inputsRef = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        // Small delay so the modal animation finishes first
        const t = setTimeout(() => inputsRef.current[0]?.focus(), 400)
        return () => clearTimeout(t)
    }, [])

    const handleSubmit = useCallback(async (fullCode: string) => {
        setLoading(true)
        setError("")

        try {
            const res = await fetch(`/api/guide-access?verify=${fullCode}`)
            const data = await res.json()

            if (data.valid) {
                const name = data.name || "Guest"
                setGuestName(name)
                setSuccess(true)
                // Store in sessionStorage so they don't have to re-enter on same session
                sessionStorage.setItem("guide_access", "true")
                sessionStorage.setItem("guide_guest_name", name)
                setTimeout(() => onSuccess(name), 2500)
            } else {
                setError("Invalid code. Please try again.")
                setShake(true)
                setTimeout(() => setShake(false), 500)
                setCode(["", "", "", ""])
                inputsRef.current[0]?.focus()
            }
        } catch {
            setError("Something went wrong. Try again.")
        } finally {
            setLoading(false)
        }
    }, [onSuccess])

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return

        const newCode = [...code]
        newCode[index] = value.slice(-1)
        setCode(newCode)
        setError("")

        if (value && index < 3) {
            inputsRef.current[index + 1]?.focus()
        }

        if (value && index === 3) {
            const fullCode = newCode.join("")
            if (fullCode.length === 4) {
                handleSubmit(fullCode)
            }
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputsRef.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
        if (pasted.length === 4) {
            setCode(pasted.split(""))
            handleSubmit(pasted)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-100 flex items-center justify-center p-4"
            >
                {/* Blurred backdrop */}
                <motion.div
                    initial={{ backdropFilter: "blur(0px)" }}
                    animate={{ backdropFilter: "blur(20px)" }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-background/80"
                />

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-primary/20"
                            initial={{
                                x: `${20 + i * 12}%`,
                                y: `${30 + (i % 3) * 20}%`,
                                scale: 0,
                            }}
                            animate={{
                                y: [`${30 + (i % 3) * 20}%`, `${25 + (i % 3) * 20}%`, `${30 + (i % 3) * 20}%`],
                                scale: [0, 1, 0.6],
                                opacity: [0, 0.4, 0.2],
                            }}
                            transition={{
                                duration: 3 + i * 0.5,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>

                {/* Modal content */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className="relative w-full max-w-sm"
                >
                    <div className="bg-card/90 backdrop-blur-2xl rounded-3xl border border-border/50 shadow-2xl shadow-black/10 p-8 sm:p-10">
                        {/* Success state */}
                        <AnimatePresence mode="wait">
                            {success ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4"
                                    >
                                        <ShieldCheck className="w-10 h-10 text-green-500" />
                                    </motion.div>
                                    <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
                                        Welcome, {guestName}! 🎉
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Loading your house guide...
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div key="form" exit={{ opacity: 0 }}>
                                    {/* Icon */}
                                    <div className="text-center mb-8">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.1, duration: 0.4 }}
                                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
                                        >
                                            <KeyRound className="w-7 h-7 text-primary" />
                                        </motion.div>
                                        <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                                            House Guide Access
                                        </h2>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Enter the last <strong>4 digits</strong> of the phone number
                                            you used when booking.
                                        </p>
                                    </div>

                                    {/* Code inputs */}
                                    <motion.div
                                        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                                        transition={{ duration: 0.4 }}
                                        className="flex justify-center gap-3 mb-6"
                                    >
                                        {code.map((digit, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + i * 0.05 }}
                                            >
                                                <input
                                                    ref={(el) => { inputsRef.current[i] = el }}
                                                    type={showCode ? "text" : "password"}
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleChange(i, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                                    onPaste={i === 0 ? handlePaste : undefined}
                                                    className={`w-14 h-16 text-center text-2xl font-semibold rounded-xl border-2 transition-all duration-200 bg-background/50 outline-none
                                                        ${error
                                                            ? "border-destructive/50 focus:border-destructive"
                                                            : digit
                                                                ? "border-primary/40 focus:border-primary"
                                                                : "border-border focus:border-primary/60"
                                                        }
                                                        ${loading ? "opacity-60 cursor-not-allowed" : ""}
                                                    `}
                                                    disabled={loading}
                                                    autoComplete="off"
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    {/* Show/Hide */}
                                    <div className="flex justify-center mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowCode(!showCode)}
                                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            {showCode ? "Hide" : "Show"} code
                                        </button>
                                    </div>

                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                                exit={{ opacity: 0, y: -5, height: 0 }}
                                                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 mb-4"
                                            >
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Loading */}
                                    {loading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4"
                                        >
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
                                            />
                                            Verifying...
                                        </motion.div>
                                    )}

                                    {/* Info note */}
                                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/50 border border-border/50">
                                        <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            This guide is available only to confirmed guests. If you don&apos;t have a code,
                                            please contact us on{" "}
                                            <a
                                                href="https://wa.me/250788459885"
                                                className="text-green-600 dark:text-green-400 font-medium hover:underline"
                                            >
                                                WhatsApp
                                            </a>
                                            .
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer text */}
                    <p className="text-center text-xs text-muted-foreground/60 mt-6">
                        Protected content · Velstays House Guide
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
