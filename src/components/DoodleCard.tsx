import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  alt?: boolean
}

export function DoodleCard({
  children,
  alt = false,
  className = '',
  ...rest
}: Props) {
  const borderClass = alt ? 'doodle-border-alt' : 'doodle-border'
  return (
    <div
      {...rest}
      className={`${borderClass} doodle-shadow bg-paper p-6 md:p-8 ${className}`}
    >
      {children}
    </div>
  )
}
