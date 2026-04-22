import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { annotate } from 'rough-notation'
import type {
  RoughAnnotation,
  RoughAnnotationType,
} from 'rough-notation/lib/model'

type Props = {
  children: ReactNode
  type: RoughAnnotationType
  color: string
  show: boolean
  delay?: number
  strokeWidth?: number
  multiline?: boolean
  padding?: number
}

export function Rough({
  children,
  type,
  color,
  show,
  delay = 0,
  strokeWidth = 2,
  multiline = true,
  padding = 2,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const annotationRef = useRef<RoughAnnotation | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const a = annotate(ref.current, {
      type,
      color,
      strokeWidth,
      multiline,
      padding,
      animationDuration: 900,
      iterations: 2,
    })
    annotationRef.current = a
    return () => {
      a.remove()
      annotationRef.current = null
    }
  }, [type, color, strokeWidth, multiline, padding])

  useEffect(() => {
    if (!show) {
      annotationRef.current?.hide()
      return
    }
    const t = window.setTimeout(() => {
      annotationRef.current?.show()
    }, delay)
    return () => window.clearTimeout(t)
  }, [show, delay])

  return <span ref={ref}>{children}</span>
}
