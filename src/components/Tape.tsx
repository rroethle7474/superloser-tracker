import type { CSSProperties } from 'react'

type TapeColor = 'yellow' | 'blue' | 'pink'
type TapePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

// Washi tape: diagonal pastel stripes, semi-transparent so a hint of the
// underlying card bleeds through. Torn-edge clip-path gives it a slightly
// irregular silhouette so it doesn't read as a clean rectangle.
const BACKGROUND_BY_COLOR: Record<TapeColor, string> = {
  yellow:
    'repeating-linear-gradient(-45deg, rgba(255,230,100,0.62) 0 6px, rgba(255,205,50,0.62) 6px 12px)',
  blue:
    'repeating-linear-gradient(-45deg, rgba(120,180,255,0.55) 0 6px, rgba(70,140,230,0.55) 6px 12px)',
  pink:
    'repeating-linear-gradient(-45deg, rgba(255,160,160,0.6) 0 6px, rgba(240,120,120,0.6) 6px 12px)',
}

const POSITION_STYLES: Record<TapePosition, CSSProperties> = {
  'top-left': { top: -10, left: 24, transform: 'rotate(-8deg)' },
  'top-right': { top: -10, right: 24, transform: 'rotate(6deg)' },
  'bottom-left': { bottom: -10, left: 32, transform: 'rotate(5deg)' },
  'bottom-right': { bottom: -10, right: 32, transform: 'rotate(-7deg)' },
}

type Props = {
  color?: TapeColor
  position: TapePosition
}

export function Tape({ color = 'yellow', position }: Props) {
  return (
    <span
      aria-hidden="true"
      role="presentation"
      className="absolute w-16 h-4 md:w-20 md:h-5 pointer-events-none z-10"
      style={{
        ...POSITION_STYLES[position],
        background: BACKGROUND_BY_COLOR[color],
        boxShadow: '1px 2px 3px rgba(0, 0, 0, 0.12)',
        // Slightly jagged edges — reads as torn tape, not a CAD rectangle.
        clipPath:
          'polygon(2% 20%, 6% 0%, 30% 14%, 60% 4%, 94% 12%, 100% 30%, 98% 75%, 94% 100%, 65% 92%, 30% 100%, 4% 88%, 0% 50%)',
      }}
    />
  )
}
