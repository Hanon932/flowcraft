import { useEffect, useRef } from 'react'

export function useDriveAutoSave(enabled: boolean, data: unknown, save: () => void, delayMs = 2500) {
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])

  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(() => {
      saveRef.current()
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [enabled, data, delayMs])
}
