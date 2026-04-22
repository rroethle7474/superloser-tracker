import { useEffect, useRef, useState } from 'react'

type Piece = {
  id: number
  emoji: string
  left: number
  delay: number
  duration: number
  rotate: number
  scale: number
}

const EMOJIS = ['🐾', '🦴', '⭐', '🎉', '✨', '🐕', '🎊', '🐶']

function generatePieces(): Piece[] {
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    emoji: EMOJIS[i % EMOJIS.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2.6 + Math.random() * 1.6,
    rotate: (Math.random() - 0.5) * 720,
    scale: 0.8 + Math.random() * 0.8,
  }))
}

type Props = {
  show: boolean
  onDone: () => void
}

export function Confetti({ show, onDone }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [prevShow, setPrevShow] = useState(show)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // Regenerate pieces whenever the parent flips show to true. Using the
  // setState-during-render pattern keeps this out of useEffect (and quiets the
  // react-hooks/set-state-in-effect rule).
  if (show !== prevShow) {
    setPrevShow(show)
    if (show) setPieces(generatePieces())
  }

  useEffect(() => {
    if (!show) return
    const timer = window.setTimeout(() => onDoneRef.current(), 4500)
    return () => window.clearTimeout(timer)
  }, [show])

  if (!show || pieces.length === 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[60] overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute text-3xl md:text-4xl select-none"
          style={{
            left: `${p.left}%`,
            top: 0,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.33, 0.06, 0.55, 1) ${p.delay}s forwards`,
            ['--rotate' as string]: `${p.rotate}deg`,
            ['--scale' as string]: p.scale,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
