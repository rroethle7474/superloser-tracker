import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  rotate?: number
  opacity?: number
  className?: string
  delay?: number
}

/**
 * "Rubber stamp" decoration — slams in at a slightly off rotation and settles.
 * Opacity is baked into the animate target (not a Tailwind class) because
 * framer-motion's inline `opacity` style would otherwise override it.
 */
export function Stamp({
  children,
  rotate = -12,
  opacity = 0.4,
  className = '',
  delay = 0,
}: Props) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 0, scale: 1.6, rotate: rotate + 8 }}
      animate={{ opacity, scale: 1, rotate }}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 18,
        delay,
      }}
      className={`inline-block font-stamp font-bold tracking-wider uppercase pointer-events-none select-none leading-none ${className}`}
    >
      {children}
    </motion.span>
  )
}
