import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { DoodleButton } from '../DoodleButton'
import { DoodleCard } from '../DoodleCard'
import { Tape } from '../Tape'
import { supabase } from '../../lib/supabase'
import { useAdminToken } from '../../hooks/useAdminToken'
import { useRefetchOnVisible } from '../../hooks/useRefetchOnVisible'
import type { Tables } from '../../types/database'
import goofballImg from '../../assets/Goofball.jpeg'
import poppyImg from '../../assets/Poppy.jpg'
import waltImg from '../../assets/WALT.jpeg'

type Comment = Tables<'comments'>

type Props = {
  isAdmin: boolean
}

const OWNED_STORAGE_KEY = 'superloser.owned_comments.v1'
const PAGE_SIZE = 5

type NameRule = {
  avatar?: string
  avatarAlt?: string
  badge?: { label: string; className: string }
}

// Case-insensitive, trimmed name → fun little easter eggs.
const NAME_RULES: Record<string, NameRule> = {
  poppy: { avatar: poppyImg, avatarAlt: 'Poppy' },
  walt: { avatar: waltImg, avatarAlt: 'Walt' },
  justin: {
    badge: { label: 'Super Loser', className: 'bg-accent text-paper' },
  },
  emily: {
    badge: { label: 'Leader', className: 'bg-accent-4 text-paper' },
  },
  ryan: {
    avatar: goofballImg,
    avatarAlt: 'Goofball',
    badge: { label: 'The Superloser', className: 'bg-accent-2 text-ink' },
  },
  mom: { badge: { label: 'Mom/Grandma', className: 'bg-pink-400 text-ink' } },
  sue: { badge: { label: 'Mom/Grandma', className: 'bg-pink-400 text-ink' } },
  dad: { badge: { label: 'Dad/Grandpa', className: 'bg-sky-500 text-paper' } },
  clarence: {
    badge: { label: 'Dad/Grandpa', className: 'bg-sky-500 text-paper' },
  },
}

function getNameRule(name: string): NameRule {
  return NAME_RULES[name.trim().toLowerCase()] ?? {}
}

function loadOwnedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(OWNED_STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function persistOwnedIds(ids: Set<string>) {
  try {
    localStorage.setItem(OWNED_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Quota exceeded or disabled — silently ignore.
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function CommentsSection({ isAdmin }: Props) {
  const adminToken = useAdminToken()

  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => loadOwnedIds())
  const [page, setPage] = useState(0)

  // Post-form state
  const [postName, setPostName] = useState('')
  const [postBody, setPostBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  async function loadComments() {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('[comments] load failed', error)
    setComments(data ?? [])
  }

  // Initial fetch — newest first so page 1 always shows the latest.
  useEffect(() => {
    let active = true
    ;(async () => {
      await loadComments()
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  // Catch up when returning from a backgrounded tab / locked phone.
  useRefetchOnVisible(loadComments)

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments((current) => {
              const incoming = payload.new as Comment
              if (current.some((c) => c.id === incoming.id)) return current
              return [incoming, ...current]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Comment
            setComments((current) =>
              current.map((c) => (c.id === updated.id ? updated : c)),
            )
          } else if (payload.eventType === 'DELETE') {
            const removed = payload.old as { id: string }
            setComments((current) =>
              current.filter((c) => c.id !== removed.id),
            )
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function handlePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = postBody.trim()
    if (!body) return
    setPosting(true)
    setPostError(null)
    try {
      const { data, error } = await supabase.rpc('add_comment', {
        p_author_name: postName.trim() || 'Anonymous',
        p_body: body,
        admin_token: adminToken ?? undefined,
      })
      if (error) throw error
      if (data) {
        const inserted = data as unknown as Comment
        // Optimistic add — realtime will dedupe on the check above.
        setComments((current) => {
          if (current.some((c) => c.id === inserted.id)) return current
          return [inserted, ...current]
        })
        // Remember we own this comment so we can edit it later.
        setOwnedIds((prev) => {
          const next = new Set(prev)
          next.add(inserted.id)
          persistOwnedIds(next)
          return next
        })
      }
      setPostBody('')
      // Jump back to the first page so the new comment is visible.
      setPage(0)
    } catch (err) {
      console.error('[comments] post failed', err)
      setPostError(err instanceof Error ? err.message : 'Post failed.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <section id="comments" className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-center mb-2">Comments</h2>
      <p className="text-center text-ink-soft text-lg mb-8">
        Be nice. Or don't. It's your call.
      </p>

      <DoodleCard className="relative mb-8">
        <Tape color="yellow" position="top-left" />
        <Tape color="pink" position="bottom-right" />
        <form onSubmit={handlePost} className="space-y-3">
          {!isAdmin && (
            <input
              type="text"
              placeholder="Post as…"
              value={postName}
              onChange={(event) => setPostName(event.target.value)}
              maxLength={60}
              className="doodle-border-alt w-full px-3 py-2 bg-paper text-lg"
              disabled={posting}
            />
          )}
          <textarea
            placeholder="What's on your mind?"
            value={postBody}
            onChange={(event) => setPostBody(event.target.value)}
            rows={3}
            maxLength={1000}
            className="doodle-border w-full px-3 py-2 bg-paper text-lg"
            disabled={posting}
          />
          {postError && (
            <p className="text-sm text-accent">{postError}</p>
          )}
          <div className="flex justify-end">
            <DoodleButton type="submit" disabled={posting || !postBody.trim()}>
              {posting ? 'Posting…' : isAdmin ? 'Post as Sitter' : 'Post comment'}
            </DoodleButton>
          </div>
        </form>
      </DoodleCard>

      {loading ? (
        <p className="text-center text-ink-soft">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-ink-soft">
          No comments yet. Say something.
        </p>
      ) : (
        (() => {
          const totalPages = Math.max(1, Math.ceil(comments.length / PAGE_SIZE))
          const safePage = Math.min(page, totalPages - 1)
          const start = safePage * PAGE_SIZE
          const displayed = comments.slice(start, start + PAGE_SIZE)
          return (
            <>
              <ul className="space-y-4">
                {displayed.map((comment) => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    canManage={isAdmin || ownedIds.has(comment.id)}
                    onUpdated={(next) =>
                      setComments((current) =>
                        current.map((c) => (c.id === next.id ? next : c)),
                      )
                    }
                    onDeleted={(id) => {
                      setComments((current) => current.filter((c) => c.id !== id))
                      setOwnedIds((prev) => {
                        if (!prev.has(id)) return prev
                        const next = new Set(prev)
                        next.delete(id)
                        persistOwnedIds(next)
                        return next
                      })
                    }}
                  />
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                  <DoodleButton
                    type="button"
                    variant="ghost"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                  >
                    ← Newer
                  </DoodleButton>
                  <p className="font-display text-xl text-ink-soft">
                    Page {safePage + 1} of {totalPages}
                  </p>
                  <DoodleButton
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={safePage >= totalPages - 1}
                  >
                    Older →
                  </DoodleButton>
                </div>
              )}
            </>
          )
        })()
      )}
    </section>
  )
}

type CommentRowProps = {
  comment: Comment
  canManage: boolean
  onUpdated: (next: Comment) => void
  onDeleted: (id: string) => void
}

function CommentRow({ comment, canManage, onUpdated, onDeleted }: CommentRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.body)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rule = useMemo(() => getNameRule(comment.author_name), [
    comment.author_name,
  ])

  const wasEdited = comment.updated_at !== comment.created_at
  const timestamp = formatTimestamp(comment.updated_at)

  function startEdit() {
    setDraft(comment.body)
    setError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError(null)
  }

  async function saveEdit() {
    const next = draft.trim()
    if (!next) {
      setError('Comment can’t be empty.')
      return
    }
    if (next === comment.body) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { data, error: rpcErr } = await supabase.rpc('edit_comment', {
        comment_id: comment.id,
        p_body: next,
      })
      if (rpcErr) throw rpcErr
      if (data) {
        onUpdated(data as unknown as Comment)
      }
      setEditing(false)
    } catch (err) {
      console.error('[comments] edit failed', err)
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteComment() {
    setDeleting(true)
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('delete_comment', {
        comment_id: comment.id,
      })
      if (rpcErr) throw rpcErr
      onDeleted(comment.id)
    } catch (err) {
      console.error('[comments] delete failed', err)
      setError(err instanceof Error ? err.message : 'Delete failed.')
      setDeleting(false)
    }
  }

  return (
    <li>
      <DoodleCard alt={!comment.is_admin}>
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {rule.avatar && (
              <img
                src={rule.avatar}
                alt={rule.avatarAlt ?? ''}
                className="w-9 h-9 rounded-full object-cover border-2 border-ink shrink-0"
              />
            )}
            <p className="font-display text-2xl leading-none">
              {comment.author_name}
            </p>
            {rule.badge && (
              <span
                className={`doodle-border-alt px-2 py-0.5 text-sm font-doodle leading-none ${rule.badge.className}`}
              >
                {rule.badge.label}
              </span>
            )}
            {comment.is_admin && (
              <span className="doodle-border-alt bg-accent-3 text-paper px-2 py-0.5 text-sm font-doodle leading-none">
                Sitter
              </span>
            )}
          </div>
          <div className="text-right text-sm text-ink-soft leading-tight whitespace-nowrap">
            <time>{timestamp}</time>
            {wasEdited && <div className="italic">(edited)</div>}
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={1000}
              className="doodle-border-alt w-full px-3 py-2 bg-paper text-lg"
              disabled={saving}
              autoFocus
            />
            {error && <p className="text-sm text-accent">{error}</p>}
            <div className="flex justify-end gap-2">
              <DoodleButton
                type="button"
                variant="ghost"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </DoodleButton>
              <DoodleButton type="button" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </DoodleButton>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{comment.body}</p>
            {error && <p className="text-sm text-accent mt-2">{error}</p>}
            {canManage && (
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={startEdit}
                  disabled={deleting}
                  className="doodle-border-alt doodle-shadow-sm bg-paper hover:bg-paper-dark px-4 py-2 text-base transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={deleteComment}
                  disabled={deleting}
                  className="doodle-border-alt doodle-shadow-sm bg-paper text-accent hover:bg-accent hover:text-paper px-4 py-2 text-base transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </>
        )}
      </DoodleCard>
    </li>
  )
}
