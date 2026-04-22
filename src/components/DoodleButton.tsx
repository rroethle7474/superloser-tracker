import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-paper hover:bg-accent/90',
  secondary: 'bg-accent-2 text-ink hover:bg-accent-2/90',
  ghost: 'bg-paper text-ink hover:bg-paper-dark',
}

export function DoodleButton({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={`doodle-border doodle-shadow-sm px-5 py-2 text-xl transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
