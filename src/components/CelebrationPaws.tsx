import { motion } from 'framer-motion'

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff']

type PawSpec = {
  top: string
  left: string
  size: number
  rotate: number
}

// Fixed scatter — hand-tuned so paws spread across the full tracker section
// (top banner, over the scene card, across the tasks grid, and in the bottom
// gutter). Sizes vary from ~36 to ~72 so the eye finds anchors + punctuation.
const PAWS: PawSpec[] = [
  { top: '2%', left: '7%', size: 54, rotate: -24 },
  { top: '3%', left: '88%', size: 48, rotate: 18 },
  { top: '6%', left: '48%', size: 36, rotate: 8 },
  { top: '13%', left: '16%', size: 66, rotate: -12 },
  { top: '18%', left: '86%', size: 58, rotate: 22 },
  { top: '24%', left: '52%', size: 42, rotate: -18 },
  { top: '34%', left: '4%', size: 56, rotate: 28 },
  { top: '36%', left: '94%', size: 50, rotate: -22 },
  { top: '48%', left: '11%', size: 72, rotate: 14 },
  { top: '50%', left: '88%', size: 62, rotate: -16 },
  { top: '62%', left: '46%', size: 44, rotate: 20 },
  { top: '68%', left: '6%', size: 58, rotate: -10 },
  { top: '72%', left: '92%', size: 52, rotate: 12 },
  { top: '82%', left: '18%', size: 66, rotate: -24 },
  { top: '88%', left: '82%', size: 54, rotate: 18 },
  { top: '94%', left: '48%', size: 48, rotate: -14 },
]

type Props = {
  show: boolean
}

export function CelebrationPaws({ show }: Props) {
  if (!show) return null
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-10"
    >
      {PAWS.map((paw, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: paw.top,
            left: paw.left,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill={COLORS[i % COLORS.length]}
            initial={{ opacity: 0, scale: 0.4, rotate: paw.rotate - 30 }}
            animate={{ opacity: 0.5, scale: 1, rotate: paw.rotate }}
            transition={{
              delay: i * 0.055,
              duration: 0.45,
              ease: 'backOut',
            }}
            style={{
              width: paw.size,
              height: paw.size,
              display: 'block',
              filter: 'drop-shadow(1.5px 2px 0 rgba(26, 26, 26, 0.25))',
            }}
          >
            <circle cx="12" cy="16" r="4" />
            <ellipse cx="6" cy="10" rx="1.8" ry="2.4" />
            <ellipse cx="10" cy="5" rx="1.7" ry="2.2" />
            <ellipse cx="14" cy="5" rx="1.7" ry="2.2" />
            <ellipse cx="18" cy="10" rx="1.8" ry="2.4" />
          </motion.svg>
        </div>
      ))}
    </div>
  )
}
