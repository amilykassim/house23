"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react"
import { VelstaysBrand } from "@/components/velstays-brand"

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  )
}

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") || "/admin"

  const [passcode, setPasscode] = useState(["", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPasscode, setShowPasscode] = useState(false)
  const [shake, setShake] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newPasscode = [...passcode]
    newPasscode[index] = value.slice(-1)
    setPasscode(newPasscode)
    setError("")

    // Auto-focus next input
    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are entered
    if (value && index === 3) {
      const fullCode = newPasscode.join("")
      if (fullCode.length === 4) {
        handleSubmit(fullCode)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !passcode[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    if (pasted.length === 4) {
      const newPasscode = pasted.split("")
      setPasscode(newPasscode)
      handleSubmit(pasted)
    }
  }

  const handleSubmit = async (code: string) => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      })

      if (res.ok) {
        router.push(returnTo)
        router.refresh()
      } else {
        setError("Incorrect passcode")
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setPasscode(["", "", "", ""])
        inputsRef.current[0]?.focus()
      }
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
            >
              <Lock className="w-7 h-7 text-primary" />
            </motion.div>
            <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">
              <VelstaysBrand delay={0.3} /> Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your passcode to continue
            </p>
          </div>

          {/* Passcode Inputs */}
          <motion.div
            animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-3 mb-6"
          >
            {passcode.map((digit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <input
                  ref={(el) => { inputsRef.current[i] = el }}
                  type={showPasscode ? "text" : "password"}
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

          {/* Show/Hide toggle */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPasscode ? "Hide" : "Show"} passcode
            </button>
          </div>

          {/* Error Message */}
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

          {/* Loading indicator */}
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
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected area · Velstays Admin Panel
        </p>
      </motion.div>
    </div>
  )
}
