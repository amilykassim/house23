"use client"

import { useState } from "react"
import { format, differenceInDays } from "date-fns"
import {
    CalendarDays,
    Users,
    User,
    Phone,
    Mail,
    MessageSquare,
    CreditCard,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Copy,
    Check,
    Smartphone,
    Send,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import type { DateRange } from "react-day-picker"

const WHATSAPP_NUMBER = "250788459885"
const MOMO_CODE = "*182*8*1*12345#"
const MOMO_NUMBER = "0788459885"

interface BookingWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    houseName: string
    dateRange: DateRange | undefined
    guests: string
    pricePerNight: number
    cleaningFee: number
    serviceFee: number
}

const steps = [
    { id: 1, label: "Review", icon: CalendarDays },
    { id: 2, label: "Your Info", icon: User },
    { id: 3, label: "Payment", icon: CreditCard },
    { id: 4, label: "Confirm", icon: CheckCircle2 },
]

export function BookingWizard({
    open,
    onOpenChange,
    houseName,
    dateRange,
    guests,
    pricePerNight,
    cleaningFee,
    serviceFee,
}: BookingWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [direction, setDirection] = useState<"forward" | "backward">("forward")
    const [copied, setCopied] = useState(false)

    // Guest info
    const [guestName, setGuestName] = useState("")
    const [guestPhone, setGuestPhone] = useState("")
    const [guestEmail, setGuestEmail] = useState("")
    const [specialRequests, setSpecialRequests] = useState("")
    const [momoTransactionId, setMomoTransactionId] = useState("")

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({})

    const nights =
        dateRange?.from && dateRange?.to
            ? differenceInDays(dateRange.to, dateRange.from)
            : 0

    const subtotal = nights * pricePerNight
    const applicableCleaningFee = nights >= 3 ? cleaningFee : 0
    const total = subtotal + applicableCleaningFee + serviceFee

    const goNext = () => {
        if (currentStep === 2) {
            const newErrors: Record<string, string> = {}
            if (!guestName.trim()) newErrors.name = "Name is required"
            if (!guestPhone.trim()) newErrors.phone = "Phone number is required"
            if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
                newErrors.email = "Invalid email address"
            }
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                return
            }
        }
        if (currentStep === 3) {
            const newErrors: Record<string, string> = {}
            if (!momoTransactionId.trim()) newErrors.momo = "Transaction ID is required"
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                return
            }
        }
        setErrors({})
        setDirection("forward")
        setCurrentStep((s) => Math.min(s + 1, 4))
    }

    const goBack = () => {
        setErrors({})
        setDirection("backward")
        setCurrentStep((s) => Math.max(s - 1, 1))
    }

    const copyMomoCode = () => {
        navigator.clipboard.writeText(MOMO_CODE)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const goToStep = (step: number) => {
        setDirection(step < currentStep ? "backward" : "forward")
        setCurrentStep(step)
    }

    const buildWhatsAppMessage = () => {
        const checkIn = dateRange?.from ? format(dateRange.from, "EEE, MMM d, yyyy") : "N/A"
        const checkOut = dateRange?.to ? format(dateRange.to, "EEE, MMM d, yyyy") : "N/A"

        const message = `🏠 *New Booking Request - Casamigo ${houseName}*

👤 *Guest Details*
• Name: ${guestName}
• Phone: ${guestPhone}${guestEmail ? `\n• Email: ${guestEmail}` : ""}

📅 *Stay Details*
• Check-in: ${checkIn}
• Check-out: ${checkOut}
• Nights: ${nights}
• Guests: ${guests}

💰 *Payment Summary*
• ${nights} nights × $${pricePerNight} = $${subtotal}${applicableCleaningFee > 0 ? `\n• Cleaning fee: $${applicableCleaningFee}` : ""}${serviceFee > 0 ? `\n• Service fee: $${serviceFee}` : ""}
• *Total: $${total}*

📱 *MoMo Transaction ID:* ${momoTransactionId}
${specialRequests ? `\n📝 *Special Requests:*\n${specialRequests}` : ""}

_Sent from Casamigo website_`

        return encodeURIComponent(message)
    }

    const sendToWhatsApp = () => {
        const message = buildWhatsAppMessage()
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank")
    }

    const handleClose = () => {
        onOpenChange(false)
        // Reset after animation
        setTimeout(() => {
            setCurrentStep(1)
            setErrors({})
        }, 300)
    }

    const slideVariants = {
        enter: (dir: "forward" | "backward") => ({
            x: dir === "forward" ? 80 : -80,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: "forward" | "backward") => ({
            x: dir === "forward" ? -80 : 80,
            opacity: 0,
        }),
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0"
                showCloseButton={true}
            >
                <DialogTitle className="sr-only">Booking Reservation</DialogTitle>

                {/* Step Indicator */}
                <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        {steps.map((step, i) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= step.id
                                            ? "bg-foreground text-background"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <Check className="h-5 w-5" />
                                        ) : (
                                            <step.icon className="h-5 w-5" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs mt-1.5 font-medium transition-colors ${currentStep >= step.id
                                            ? "text-foreground"
                                            : "text-muted-foreground"
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {i < steps.length - 1 && (
                                    <div
                                        className={`h-0.5 flex-1 mx-1 -mt-5 transition-colors duration-300 ${currentStep > step.id ? "bg-foreground" : "bg-muted"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Step Content */}
                <div className="p-6 min-h-85 overflow-y-auto flex-1">
                    <AnimatePresence mode="wait" custom={direction}>
                        {currentStep === 1 && (
                            <motion.div
                                key="step-1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <h3 className="text-lg font-semibold text-foreground mb-1">
                                    Review Your Booking
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Make sure everything looks good before continuing.
                                </p>

                                <div className="space-y-4">
                                    {/* House */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <span className="text-lg">🏠</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Casamigo {houseName}</p>
                                            <p className="text-xs text-muted-foreground">Kicukiro - Kigali, Rwanda</p>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <CalendarDays className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Check-in</p>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {dateRange?.from
                                                            ? format(dateRange.from, "EEE, MMM d")
                                                            : "—"}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Check-out</p>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {dateRange?.to
                                                            ? format(dateRange.to, "EEE, MMM d")
                                                            : "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guests */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Guests</p>
                                            <p className="text-sm font-medium text-foreground">
                                                {guests} {Number(guests) === 1 ? "guest" : "guests"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <Separator className="my-2" />

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                ${pricePerNight} × {nights} night{nights > 1 ? "s" : ""}
                                            </span>
                                            <span className="text-foreground">${subtotal}</span>
                                        </div>
                                        {applicableCleaningFee > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Cleaning fee</span>
                                                <span className="text-foreground">${applicableCleaningFee}</span>
                                            </div>
                                        )}
                                        {serviceFee > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Service fee</span>
                                                <span className="text-foreground">${serviceFee}</span>
                                            </div>
                                        )}
                                        <Separator className="my-1" />
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-foreground">Total</span>
                                            <span className="text-foreground">${total}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step-2"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <h3 className="text-lg font-semibold text-foreground mb-1">
                                    Your Information
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Tell us a bit about yourself so we can prepare for your stay.
                                </p>

                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                value={guestName}
                                                onChange={(e) => {
                                                    setGuestName(e.target.value)
                                                    if (errors.name) setErrors((p) => ({ ...p, name: "" }))
                                                }}
                                                placeholder="John Doe"
                                                className={`pl-10 h-11 rounded-xl ${errors.name ? "border-red-500" : ""}`}
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                value={guestPhone}
                                                onChange={(e) => {
                                                    setGuestPhone(e.target.value)
                                                    if (errors.phone) setErrors((p) => ({ ...p, phone: "" }))
                                                }}
                                                placeholder="+250 7XX XXX XXX"
                                                type="tel"
                                                className={`pl-10 h-11 rounded-xl ${errors.phone ? "border-red-500" : ""}`}
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                                            Email <span className="text-muted-foreground text-xs">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                value={guestEmail}
                                                onChange={(e) => {
                                                    setGuestEmail(e.target.value)
                                                    if (errors.email) setErrors((p) => ({ ...p, email: "" }))
                                                }}
                                                placeholder="john@example.com"
                                                type="email"
                                                className={`pl-10 h-11 rounded-xl ${errors.email ? "border-red-500" : ""}`}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Special Requests */}
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                                            Special Requests{" "}
                                            <span className="text-muted-foreground text-xs">(optional)</span>
                                        </label>
                                        <Textarea
                                            value={specialRequests}
                                            onChange={(e) => setSpecialRequests(e.target.value)}
                                            placeholder="Early check-in, extra pillows, airport pickup..."
                                            className="rounded-xl min-h-20 resize-none"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step-3"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <h3 className="text-lg font-semibold text-foreground mb-1">
                                    Payment via Mobile Money
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Send the payment via MTN MoMo, then enter the transaction ID below.
                                </p>

                                <div className="space-y-5">
                                    {/* Amount to pay */}
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                                        <p className="text-sm text-muted-foreground mb-1">Amount to pay</p>
                                        <p className="text-3xl font-bold text-foreground">${total}</p>
                                    </div>

                                    {/* MoMo Instructions */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <Smartphone className="h-4 w-4" />
                                            How to pay with MoMo
                                        </h4>

                                        <div className="space-y-2.5">
                                            <div className="flex gap-3 items-start">
                                                <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                    1
                                                </div>
                                                <div>
                                                    <p className="text-sm text-foreground">
                                                        Dial this MoMo code on your phone:
                                                    </p>
                                                    <button
                                                        onClick={copyMomoCode}
                                                        className="flex items-center gap-2 mt-1 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                                    >
                                                        <span className="font-mono font-semibold text-sm">
                                                            {MOMO_CODE}
                                                        </span>
                                                        {copied ? (
                                                            <Check className="h-3.5 w-3.5 text-green-500" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 items-start">
                                                <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                    2
                                                </div>
                                                <div>
                                                    <p className="text-sm text-foreground">
                                                        Enter the amount: <span className="font-semibold">${total}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 items-start">
                                                <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                    3
                                                </div>
                                                <div>
                                                    <p className="text-sm text-foreground">
                                                        Enter your MoMo PIN to confirm the payment
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 items-start">
                                                <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                    4
                                                </div>
                                                <div>
                                                    <p className="text-sm text-foreground">
                                                        Copy the <span className="font-semibold">Transaction ID</span> from the confirmation SMS
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Transaction ID Input */}
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                                            MoMo Transaction ID <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={momoTransactionId}
                                            onChange={(e) => {
                                                setMomoTransactionId(e.target.value)
                                                if (errors.momo) setErrors((p) => ({ ...p, momo: "" }))
                                            }}
                                            placeholder="e.g. TxId:27033141149"
                                            className={`h-11 rounded-xl font-mono ${errors.momo ? "border-red-500" : ""}`}
                                        />
                                        {errors.momo && (
                                            <p className="text-xs text-red-500 mt-1">{errors.momo}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1.5">
                                            You&apos;ll receive this in the MoMo confirmation SMS
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 4 && (
                            <motion.div
                                key="step-4"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-1">
                                        Almost There!
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Review your booking summary below, then send it to the host via WhatsApp.
                                    </p>
                                </div>

                                {/* Summary Card */}
                                <div className="rounded-xl border border-border p-4 space-y-3 mb-6 bg-muted/30">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Property</span>
                                        <span className="text-foreground font-medium">Casamigo {houseName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Dates</span>
                                        <span className="text-foreground font-medium">
                                            {dateRange?.from ? format(dateRange.from, "MMM d") : "—"} →{" "}
                                            {dateRange?.to ? format(dateRange.to, "MMM d") : "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Nights</span>
                                        <span className="text-foreground font-medium">{nights}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Guests</span>
                                        <span className="text-foreground font-medium">{guests}</span>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Guest</span>
                                        <span className="text-foreground font-medium">{guestName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Phone</span>
                                        <span className="text-foreground font-medium">{guestPhone}</span>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <span className="text-foreground">Total Paid</span>
                                        <span className="text-foreground">${total}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">MoMo TXN ID</span>
                                        <span className="text-foreground font-mono text-xs">{momoTransactionId}</span>
                                    </div>
                                </div>

                                {/* WhatsApp Send Button */}
                                <Button
                                    onClick={sendToWhatsApp}
                                    className="w-full h-12 rounded-xl text-base font-semibold bg-[#25D366] hover:bg-[#1DA851] text-white gap-2"
                                >
                                    <Send className="h-5 w-5" />
                                    Send Booking to Host via WhatsApp
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-3">
                                    This will open WhatsApp with your booking details pre-filled.
                                    The host will confirm and block off the dates for you.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Navigation */}
                <Separator className="shrink-0" />
                <div className="p-4 flex items-center justify-between shrink-0">
                    {currentStep > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={goBack}
                            className="rounded-xl gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    ) : (
                        <div />
                    )}

                    {currentStep < 4 && (
                        <Button
                            onClick={goNext}
                            className="rounded-xl gap-1 ml-auto"
                        >
                            {currentStep === 3 ? "Review & Confirm" : "Continue"}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}

                    {currentStep === 4 && (
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="rounded-xl ml-auto"
                        >
                            Close
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
