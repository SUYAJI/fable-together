"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  value: number | string
  duration?: number
  className?: string
  decimals?: number
  suffix?: string
  prefix?: string
}

export function AnimatedCounter({
  value,
  duration = 1500,
  className,
  decimals = 0,
  suffix = "",
  prefix = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const frameRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number | undefined>(undefined)
  const startValueRef = useRef<number>(0)
  const targetValueRef = useRef<number | string>(value)
  const containerRef = useRef<HTMLSpanElement>(null)

  // Parse the value - handle numbers, percentages, hours, etc.
  const parseValue = (val: number | string): number => {
    if (typeof val === "string") {
      // Handle percentages like "84%"
      if (val.includes("%")) {
        return parseFloat(val.replace("%", ""))
      }
      // Handle hours like "3.2h" or "12.5h"
      else if (val.includes("h")) {
        return parseFloat(val.replace("h", ""))
      }
      // Handle time like "10 min", "12 min", "15 min"
      else if (val.includes("min")) {
        return parseFloat(val.replace("min", "").trim())
      }
      // Handle K notation like "2.3K", "1.8K"
      else if (val.includes("K")) {
        const num = parseFloat(val.replace("K", ""))
        return num * 1000
      }
      // Handle comma notation like "3,847", "1,248"
      else if (val.includes(",")) {
        return parseFloat(val.replace(/,/g, ""))
      }
      else {
        return parseFloat(val) || 0
      }
    }
    return val
  }

  // Start animation when element becomes visible
  useEffect(() => {
    if (!containerRef.current || hasAnimated) return

    const numericValue = parseValue(value)
    
    if (isNaN(numericValue)) {
      setDisplayValue(0)
      return
    }

    // Use Intersection Observer to trigger animation when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            targetValueRef.current = numericValue
            startValueRef.current = 0
            setDisplayValue(0)
            startTimeRef.current = Date.now()

            const animate = () => {
              const now = Date.now()
              const elapsed = now - (startTimeRef.current || now)
              const progress = Math.min(elapsed / duration, 1)

              // Easing function for smooth animation
              const easeOutQuart = 1 - Math.pow(1 - progress, 4)

              const current = startValueRef.current + (numericValue - startValueRef.current) * easeOutQuart
              
              if (progress < 1) {
                setDisplayValue(current)
                frameRef.current = requestAnimationFrame(animate)
              } else {
                setDisplayValue(numericValue)
              }
            }

            // Small delay to ensure smooth start
            setTimeout(() => {
              frameRef.current = requestAnimationFrame(animate)
            }, 100)

            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "0px",
      }
    )

    observer.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [value, duration, hasAnimated])

  // Reset animation state when value changes
  useEffect(() => {
    setHasAnimated(false)
    setDisplayValue(0)
  }, [value])

    // Format the display value
    const formatValue = (val: number): string => {
      // Check if original value was a percentage string
      const isPercentage = typeof value === "string" && value.includes("%")
      
      // Check if original value was hours
      const isHours = typeof value === "string" && value.includes("h") && !value.includes("min")
      
      // Check if original value was K notation
      const originalValueStr = typeof value === "string" ? value : ""
      const wasKNotation = originalValueStr.includes("K")
      
      if (isPercentage) {
        return val.toFixed(0) + "%"
      }
      
      if (isHours) {
        return val.toFixed(1) + "h"
      }
      
      // Handle K notation for display
      if (wasKNotation && val >= 1000) {
        return (val / 1000).toFixed(1) + "K"
      }
      
      // Handle large numbers with commas
      if (val >= 1000 && !isPercentage && !isHours && !wasKNotation) {
        return Math.floor(val).toLocaleString()
      }
      
      // Regular number formatting
      if (decimals === 0) {
        return Math.floor(val).toString()
      }
      return val.toFixed(decimals)
    }

  // Determine if we need to add suffix
  const needsSuffix = suffix && !(typeof value === "string" && (value.includes("%") || value.includes("h") || value.includes("K")))
  
  return (
    <span ref={containerRef} className={cn("tabular-nums", className)}>
      {prefix}
      {formatValue(displayValue)}
      {needsSuffix ? suffix : ""}
    </span>
  )
}

