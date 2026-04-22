import { motion } from 'framer-motion'

type Props = {
  completed: number
  total: number
}

export function TrackerProgress({ completed, total }: Props) {
  if (total === 0) return null
  const pct = Math.round((completed / total) * 100)
  const allDone = completed === total

  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
        <span className="font-display text-2xl md:text-3xl leading-none">
          {completed} of {total} chores survived
        </span>
        {allDone && (
          <span className="font-display text-accent text-xl md:text-2xl -rotate-2 leading-none">
            (nailed it)
          </span>
        )}
      </div>
      <div className="doodle-border-alt bg-paper-dark h-3 md:h-4 overflow-hidden relative">
        <motion.div
          className="absolute inset-y-0 left-0 bg-accent-3"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
