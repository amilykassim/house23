'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export function ForceTheme({ theme }: { theme: string }) {
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme(theme)
  }, [theme, setTheme])

  return null
}
