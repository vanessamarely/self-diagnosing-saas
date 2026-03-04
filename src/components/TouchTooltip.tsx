import * as React from 'react'
import { ReactNode, cloneElement, isValidElement, useRef, useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTouchTooltip } from '@/hooks/use-touch-tooltip'
import { motion, AnimatePresence } from 'framer-motion'

interface TouchTooltipProps {
  children: ReactNode
  content: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  className?: string
}

export function TouchTooltip({
  children,
  content,
  side = 'top',
  sideOffset = 5,
  className,
}: TouchTooltipProps) {
  const [isHolding, setIsHolding] = useState(false)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { isOpen, setIsOpen, touchHandlers } = useTouchTooltip({
    delay: 500,
    onOpen: () => setIsHolding(true),
    onClose: () => setIsHolding(false),
  })

  const enhancedTouchHandlers = {
    ...touchHandlers,
    onTouchStart: () => {
      touchHandlers.onTouchStart()
      holdTimerRef.current = setTimeout(() => {
        setIsHolding(true)
      }, 100)
    },
    onTouchEnd: () => {
      touchHandlers.onTouchEnd()
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
      }
      setTimeout(() => setIsHolding(false), 100)
    },
    onTouchMove: () => {
      touchHandlers.onTouchMove()
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
      }
      setIsHolding(false)
    },
    onTouchCancel: () => {
      touchHandlers.onTouchCancel()
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
      }
      setIsHolding(false)
    },
  }

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          {isValidElement(children)
            ? cloneElement(children as React.ReactElement<any>, {
                ...enhancedTouchHandlers,
                className: `${(children as any).props.className || ''} ${isHolding ? 'scale-[0.98]' : ''}`,
                style: {
                  ...(children as any).props.style,
                  transition: 'transform 0.1s ease-out',
                },
              })
            : children}
        </TooltipTrigger>
        <TooltipContent side={side} sideOffset={sideOffset} className={className}>
          {content}
        </TooltipContent>
      </Tooltip>
      <AnimatePresence>
        {isHolding && !isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 pointer-events-none rounded-md border-2 border-primary bg-primary/5"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
