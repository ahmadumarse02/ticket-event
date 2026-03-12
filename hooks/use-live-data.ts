"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type LiveOptions<T> = {
  interval?: number
  initialData?: T
  enabled?: boolean
}

export function useLiveData<T>(url: string, options: LiveOptions<T> = {}) {
  const { interval = 10000, initialData, enabled = true } = options
  const [data, setData] = useState<T | undefined>(initialData)
  const [isLoading, setIsLoading] = useState(initialData === undefined)
  const [error, setError] = useState<Error | null>(null)
  const fetchRef = useRef<(showLoading?: boolean) => Promise<void>>()

  const fetchData = useCallback(
    async (showLoading = false) => {
      if (!enabled) return
      if (showLoading) setIsLoading(true)
      try {
        const response = await fetch(url, { cache: "no-store" })
        if (!response.ok) {
          throw new Error(await response.text())
        }
        const json = (await response.json()) as T
        setData(json)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    },
    [enabled, url]
  )

  fetchRef.current = fetchData

  useEffect(() => {
    if (!enabled) return
    fetchData(true)
    const timer = setInterval(() => fetchData(false), interval)
    return () => clearInterval(timer)
  }, [enabled, fetchData, interval])

  const refresh = useCallback(() => fetchRef.current?.(true), [])

  return { data, isLoading, error, refresh }
}
