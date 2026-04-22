import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

const WALK_TASK_TITLE = 'Walk Poppy'

type Task = Tables<'tasks'>

function walkInProgress(task: Task | null | undefined): boolean {
  if (!task) return false
  return Boolean(task.started_at) && !task.completed_at
}

/**
 * Subscribes to the "Walk Poppy" task and returns whether it's currently in
 * progress (started but not completed). Used by the nav's LIVE badge without
 * forcing it to pull in the full task list.
 */
export function useWalkStatus(): boolean {
  const [isWalking, setIsWalking] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('title', WALK_TASK_TITLE)
        .maybeSingle()
      if (!active) return
      if (error) {
        console.error('[walk-status] load failed', error)
        return
      }
      setIsWalking(walkInProgress(data))
    }
    void load()

    const channel = supabase
      .channel('walk-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          const row = payload.new as Task
          if (row.title !== WALK_TASK_TITLE) return
          setIsWalking(walkInProgress(row))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  return isWalking
}
