'use client'

import * as React from 'react'
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
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}
