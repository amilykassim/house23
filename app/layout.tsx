import type { Metadata } from 'next'
import { Poppins, Cormorant_Garamond, Dancing_Script } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import './globals.css'

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif"
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-brand"
});

export const metadata: Metadata = {
  title: 'Velstays | Vacation Rental',
  description: 'Experience Velstays - Designed for privacy, calm and peace, our modern home is the perfect getaway for relaxation and good vibes. Wake up to birdsong, enjoy morning walks or jogs in our safe neighborhood, and unwind in a space that feels like peace. 🌴',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '48x48',
      },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${cormorant.variable} ${dancingScript.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="theme">
          {children}
          <Toaster position="top-right" toastOptions={{ className: '!bg-card !text-foreground !border-border' }} />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
