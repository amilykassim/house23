import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AmbientSoundProvider } from '@/components/ambient-sound'
import { Toaster } from 'sonner'
import './globals.css'

const grotesk = localFont({
  src: './fonts/OverusedGrotesk-VF.woff2',
  weight: '300 900',
  variable: '--font-sans',
  display: 'swap',
})

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
    <html lang="en" className={`${grotesk.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} storageKey="theme">
          <AmbientSoundProvider>
            {children}
            <Toaster position="top-right" toastOptions={{ className: '!bg-card !text-foreground !border-border' }} />
            <Analytics />
          </AmbientSoundProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
