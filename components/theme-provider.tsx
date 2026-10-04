'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * next-themes 0.4.x injects an inline <script> to prevent FOUC.
 * React 19 warns about <script> tags rendered inside components.
 * This wrapper suppresses the warning until next-themes ships a fix.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // The back office (/admin and below) is light; everything else keeps the
  // theme the layout asks for.
  const pathname = usePathname()
  const isBackOffice = pathname === '/admin' || pathname.startsWith('/admin/')

  return (
    <NextThemesProvider {...props} forcedTheme={isBackOffice ? 'light' : props.forcedTheme}>
      {children}
    </NextThemesProvider>
  )
}
