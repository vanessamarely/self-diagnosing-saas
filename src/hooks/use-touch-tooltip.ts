import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTouchTooltipOptions {
  delay?: number
  onOpen?: () => void
  onClose?: () => void
}

export function useTouchTooltip(options: UseTouchTooltipOptions = {}) {
  const { delay = 500, onOpen, onClose } = options
  const [isOpen, setIsOpen] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggeredRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleTouchStart = useCallback(() => {
    longPressTriggeredRef.current = false
    clearTimer()
    
    timerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      setIsOpen(true)
      onOpen?.()
      
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, delay)
  }, [delay, onOpen, clearTimer])

  const handleTouchEnd = useCallback(() => {
    clearTimer()
    
    if (longPressTriggeredRef.current) {
      setTimeout(() => {
        setIsOpen(false)
        onClose?.()
      }, 2000)
    }
  }, [onClose, clearTimer])

  const handleTouchMove = useCallback(() => {
    clearTimer()
    if (longPressTriggeredRef.current) {
      setIsOpen(false)
      onClose?.()
    }
  }, [onClose, clearTimer])

  const handleTouchCancel = useCallback(() => {
    clearTimer()
    if (longPressTriggeredRef.current) {
      setIsOpen(false)
      onClose?.()
    }
  }, [onClose, clearTimer])

  const handleManualClose = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return {
    isOpen,
    setIsOpen,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleTouchCancel,
    handleManualClose,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchCancel: handleTouchCancel,
    },
  }
}
