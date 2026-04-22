import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Confetti } from '../Confetti'
import { DoodleButton } from '../DoodleButton'
import { DoodleCard } from '../DoodleCard'
import { Stamp } from '../Stamp'
import { Tape } from '../Tape'
import { TrackerProgress } from '../TrackerProgress'
import { supabase } from '../../lib/supabase'
import { useAdminToken } from '../../hooks/useAdminToken'
import { useRefetchOnVisible } from '../../hooks/useRefetchOnVisible'
import type { Tables } from '../../types/database'
import goofballImg from '../../assets/Goofball.jpeg'
import poppyImg from '../../assets/Poppy.jpg'
import waltImg from '../../assets/WALT.jpeg'

type Task = Tables<'tasks'>

type Props = {
  isAdmin: boolean
}

const avatarClass =
  'w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-[2.5px] border-ink doodle-shadow-sm bg-paper'

// Horizontal layout, percent-of-scene coordinates.
// Sussex (home) is on the left; Wauwatosa (the pets) on the right. Both are
// pulled in from the literal edges so the 80-px avatars (w-16 = 4rem at our
// 20-px root) fit fully inside the card without getting clipped by
// overflow-hidden, and neither location label spills off the edge on iPhone SE.
const SUSSEX_X = 14
const WAUWATOSA_X = 82
const HALFWAY_X = (SUSSEX_X + WAUWATOSA_X) / 2 // used for "traveling"
const LINE_Y = 58
const WALT_X = 76 // nudged left of Wauwatosa so the avatar isn't clipped on narrow phones
// Y values are the vertical *center* of each avatar, tuned so Walt, Poppy,
// the Wauwatosa label, and Goofball stack without overlapping on a 400-px-tall
// scene at iPhone-SE width (avatar is ~20 % of scene height, markers at 58 %).
const WALT_Y = 16
const POPPY_Y = 40
const GOOFBALL_Y = 85

// Task titles — source of truth for the state machine.
const TASK_ON_MY_WAY = 'On my way'
const TASK_ARRIVED = 'Arrived in house'
const TASK_WALK = 'Walk Poppy'
const TASK_DEPART = 'Lock up and depart'
const TASK_ARRIVE_SUSSEX = 'Arrive in Sussex'

const isDone = (task: Task | undefined) => Boolean(task?.completed_at)
const isStarted = (task: Task | undefined) => Boolean(task?.started_at)

// US Central time formatter (handles DST automatically via IANA zone).
const centralTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  hour: 'numeric',
  minute: '2-digit',
})

function formatCentral(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return centralTimeFormatter.format(date)
}

function formatDuration(startIso: string, endIso: string): string | null {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null
  const totalMinutes = Math.round((end - start) / 60000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

// --- Animation configs ---
// Walk oscillates the full line: Wauwatosa (right) ↔ Sussex (left) ↔ Wauwatosa.
const walkLeftKeyframes = [`${WAUWATOSA_X}%`, `${SUSSEX_X}%`]
const walkTransition = {
  duration: 7,
  repeat: Infinity,
  repeatType: 'reverse' as const,
  ease: 'easeInOut' as const,
}

function LocationMarker({ x, label }: { x: number; label: string }) {
  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{ left: `${x}%`, top: `${LINE_Y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-accent border-[2.5px] border-ink" />
      <p className="font-display text-xl md:text-2xl mt-1 whitespace-nowrap leading-none">
        {label}
      </p>
    </div>
  )
}

type TaskControlsProps = {
  task: Task
  isAdmin: boolean
  busy: boolean
  onToggleComplete: () => void
  onToggleStarted: () => void
}

function TaskControls({
  task,
  isAdmin,
  busy,
  onToggleComplete,
  onToggleStarted,
}: TaskControlsProps) {
  const done = isDone(task)
  const started = isStarted(task)
  const isWalkRow = task.title === TASK_WALK

  if (isWalkRow) {
    if (isAdmin) {
      if (done) {
        return (
          <DoodleButton
            variant="secondary"
            className="text-base px-3 py-1 min-h-[44px] min-w-[44px]"
            disabled={busy}
            onClick={onToggleComplete}
          >
            ↩︎
          </DoodleButton>
        )
      }
      if (started) {
        return (
          <DoodleButton
            variant="primary"
            className="text-sm px-3 py-1 min-h-[44px]"
            disabled={busy}
            onClick={onToggleComplete}
          >
            Finish
          </DoodleButton>
        )
      }
      return (
        <DoodleButton
          variant="primary"
          className="text-sm px-3 py-1 min-h-[44px]"
          disabled={busy}
          onClick={onToggleStarted}
        >
          Start
        </DoodleButton>
      )
    }
    // Non-admin viewer
    if (done) return <span className="text-2xl">✅</span>
    if (started)
      return (
        <span className="font-display text-accent text-lg leading-none">
          🚶‍♂️ now
        </span>
      )
    return <span className="text-ink-soft">…</span>
  }

  // Non-walk tasks: binary done/not-done
  if (isAdmin) {
    return (
      <DoodleButton
        variant={done ? 'secondary' : 'primary'}
        className="text-base px-3 py-1 min-h-[44px] min-w-[44px]"
        disabled={busy}
        onClick={onToggleComplete}
      >
        {done ? '↩︎' : '✓'}
      </DoodleButton>
    )
  }
  return done ? (
    <span className="text-2xl">✅</span>
  ) : (
    <span className="text-ink-soft">…</span>
  )
}

function TimeLabel({ task }: { task: Task }) {
  const done = isDone(task)
  const started = isStarted(task)
  const isWalkRow = task.title === TASK_WALK

  if (done) {
    const completedLabel = formatCentral(task.completed_at)
    if (!completedLabel) return null
    // Walk task done: append duration (e.g., "9:55 AM (20 min)")
    if (isWalkRow && task.started_at && task.completed_at) {
      const duration = formatDuration(task.started_at, task.completed_at)
      if (duration) {
        return (
          <span className="text-sm text-ink-soft font-doodle">
            {completedLabel} ({duration})
          </span>
        )
      }
    }
    return (
      <span className="text-sm text-ink-soft font-doodle">{completedLabel}</span>
    )
  }

  if (isWalkRow && started) {
    const startedLabel = formatCentral(task.started_at)
    if (!startedLabel) return null
    return (
      <span className="text-sm text-ink-soft font-doodle">
        Started {startedLabel}
      </span>
    )
  }

  return <span aria-hidden="true" />
}

function sortByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order_index - b.order_index)
}

export function LiveTrackerSection({ isAdmin }: Props) {
  const adminToken = useAdminToken()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  // Track prior "all done" state so confetti only fires on the transition
  // (not when someone loads the page after the morning's already wrapped).
  const prevAllDoneRef = useRef<boolean | null>(null)

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('order_index', { ascending: true })
    if (error) console.error('[tasks] load failed', error)
    setTasks(data ?? [])
  }

  // Initial fetch
  useEffect(() => {
    let active = true
    ;(async () => {
      await loadTasks()
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  // Catch up when returning from a backgrounded tab / locked phone.
  useRefetchOnVisible(loadTasks)

  // Confetti trigger: when the task list transitions from not-all-done to
  // all-done within this session, shower the page with pet emojis.
  useEffect(() => {
    if (tasks.length === 0) return
    const allDone = tasks.every((t) => Boolean(t.completed_at))
    if (prevAllDoneRef.current === false && allDone) {
      setShowConfetti(true)
    }
    prevAllDoneRef.current = allDone
  }, [tasks])

  // Realtime subscription — push toggles from admin out to all viewers
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((current) => {
              const incoming = payload.new as Task
              if (current.some((t) => t.id === incoming.id)) return current
              return sortByOrder([...current, incoming])
            })
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Task
            setTasks((current) =>
              current.map((t) => (t.id === updated.id ? updated : t)),
            )
          } else if (payload.eventType === 'DELETE') {
            const removed = payload.old as { id: string }
            setTasks((current) => current.filter((t) => t.id !== removed.id))
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleToggleComplete(task: Task) {
    if (!adminToken) return
    // Special case: undoing a completed Walk Poppy. The basic toggle would
    // only clear completed_at, leaving started_at set — i.e. "in progress" —
    // and the only escape would be Finish again. Cascade-clear started_at too
    // so the walk goes all the way back to "pending."
    const wasCompletedWalk = task.title === TASK_WALK && isDone(task)
    setBusyTaskId(task.id)
    try {
      const { data, error } = await supabase.rpc('toggle_task', {
        task_id: task.id,
        admin_token: adminToken,
      })
      if (error) throw error
      let latest = (data as unknown as Task | null) ?? null

      if (wasCompletedWalk && latest?.started_at) {
        const { data: startedData, error: startedErr } = await supabase.rpc(
          'toggle_task_started',
          { task_id: task.id, admin_token: adminToken },
        )
        if (startedErr) throw startedErr
        if (startedData) latest = startedData as unknown as Task
      }

      if (latest) {
        const finalTask = latest
        setTasks((current) =>
          current.map((t) => (t.id === finalTask.id ? finalTask : t)),
        )
      }
    } catch (err) {
      console.error('[tasks] toggle complete failed', err)
    } finally {
      setBusyTaskId(null)
    }
  }

  async function handleToggleStarted(task: Task) {
    if (!adminToken) return
    setBusyTaskId(task.id)
    try {
      const { data, error } = await supabase.rpc('toggle_task_started', {
        task_id: task.id,
        admin_token: adminToken,
      })
      if (error) throw error
      if (data) {
        const updated = data as unknown as Task
        setTasks((current) =>
          current.map((t) => (t.id === updated.id ? updated : t)),
        )
      }
    } catch (err) {
      console.error('[tasks] toggle started failed', err)
    } finally {
      setBusyTaskId(null)
    }
  }

  // --- State derivation (from real tasks) ---
  const findTask = (title: string) => tasks.find((t) => t.title === title)
  const walkTask = findTask(TASK_WALK)
  const isWalking = isStarted(walkTask) && !isDone(walkTask)
  const hasDeparted = isDone(findTask(TASK_DEPART))
  const hasArrivedSussex = isDone(findTask(TASK_ARRIVE_SUSSEX))
  const hasArrivedHouse = isDone(findTask(TASK_ARRIVED))
  const isOnMyWay = isDone(findTask(TASK_ON_MY_WAY))

  const goofballStaticX = hasArrivedSussex
    ? SUSSEX_X
    : hasDeparted
      ? HALFWAY_X
      : hasArrivedHouse
        ? WAUWATOSA_X
        : isOnMyWay
          ? HALFWAY_X
          : SUSSEX_X

  return (
    <section id="tracker" className="max-w-5xl mx-auto px-4 py-12">
      <Confetti show={showConfetti} onDone={() => setShowConfetti(false)} />
      <h2 className="text-center mb-2">Live Tracker</h2>
      <p className="text-center text-ink-soft text-lg mb-8">
        Follow Goofball from Sussex to Wauwatosa, where Poppy and Walt await.
      </p>

      {/* Scene — full width, single horizontal journey line */}
      <DoodleCard className="relative h-80 md:h-96 overflow-hidden p-0 mb-6">
        <div className="absolute inset-0 paper-bg" />

        {/* Journey line */}
        <div
          className="absolute left-[5%] right-[5%] border-t-[3px] border-dashed border-ink/70"
          style={{ top: `${LINE_Y}%` }}
        />

        {/* Location markers */}
        <LocationMarker x={SUSSEX_X} label="Sussex" />
        <LocationMarker x={WAUWATOSA_X} label="Wauwatosa" />

        {/* Walt — slightly left of the Wauwatosa marker so he fits on narrow phones.
            Wobble lives on the inner div so the outer div's translate-to-center isn't
            clobbered by the keyframe's rotate transform. */}
        <div
          className="absolute"
          style={{
            left: `${WALT_X}%`,
            top: `${WALT_Y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="wobble">
            <img src={waltImg} alt="Walt" className={avatarClass} />
          </div>
        </div>

        {/* Poppy — locked to her horizontal plane above the line; walks horizontally */}
        <motion.div
          className="absolute"
          animate={{ left: isWalking ? walkLeftKeyframes : `${WAUWATOSA_X}%` }}
          transition={
            isWalking ? walkTransition : { type: 'spring', stiffness: 50, damping: 12 }
          }
          style={{
            top: `${POPPY_Y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="wobble">
            <img src={poppyImg} alt="Poppy" className={avatarClass} />
          </div>
        </motion.div>

        {/* Goofball — locked to his horizontal plane below the line; walks horizontally */}
        <motion.div
          className="absolute"
          animate={{ left: isWalking ? walkLeftKeyframes : `${goofballStaticX}%` }}
          transition={
            isWalking ? walkTransition : { type: 'spring', stiffness: 60, damping: 14 }
          }
          style={{
            top: `${GOOFBALL_Y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="wobble">
            <img src={goofballImg} alt="Goofball" className={avatarClass} />
          </div>
        </motion.div>
      </DoodleCard>

      {/* Tasks — full width, wraps into a 12-cell grid */}
      <DoodleCard alt className="relative">
        <Tape color="yellow" position="top-left" />
        <Tape color="blue" position="bottom-right" />
        <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
          <h3 className="mb-0">Tasks</h3>
          <p className="text-sm text-ink-soft">All times in US Central</p>
        </div>
        {!loading && tasks.length > 0 && (
          <TrackerProgress
            completed={tasks.filter((t) => Boolean(t.completed_at)).length}
            total={tasks.length}
          />
        )}
        {loading ? (
          <p className="text-center text-ink-soft py-6">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-ink-soft py-6">No tasks found.</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tasks.map((task) => {
              const done = isDone(task)
              return (
                <li
                  key={task.id}
                  className="relative doodle-border-alt bg-paper p-3 flex flex-col gap-2 min-h-[112px] overflow-hidden"
                >
                  {done && (
                    <div
                      aria-hidden="true"
                      className="absolute top-1 right-2 pointer-events-none"
                    >
                      <Stamp rotate={-16} opacity={0.55} className="text-accent text-base md:text-lg">
                        Done
                      </Stamp>
                    </div>
                  )}
                  <span
                    className={
                      done
                        ? 'line-through text-ink-soft leading-tight pr-12'
                        : 'text-ink leading-tight'
                    }
                  >
                    {task.title}
                  </span>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <TimeLabel task={task} />
                    <TaskControls
                      task={task}
                      isAdmin={isAdmin}
                      busy={busyTaskId === task.id}
                      onToggleComplete={() => handleToggleComplete(task)}
                      onToggleStarted={() => handleToggleStarted(task)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </DoodleCard>
    </section>
  )
}
