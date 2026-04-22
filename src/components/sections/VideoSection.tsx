import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { DoodleButton } from '../DoodleButton'
import { DoodleCard } from '../DoodleCard'
import { DoodleModal } from '../DoodleModal'
import { Tape } from '../Tape'
import { supabase } from '../../lib/supabase'
import { useAdminToken } from '../../hooks/useAdminToken'
import { useRefetchOnVisible } from '../../hooks/useRefetchOnVisible'
import type { Tables } from '../../types/database'

type Video = Tables<'videos'>

type Props = {
  isAdmin: boolean
}

const BUCKET = 'Videos'
const MAX_FILE_BYTES = 50 * 1024 * 1024 // Supabase free-tier per-file limit

function getPublicUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VideoSection({ isAdmin }: Props) {
  const adminToken = useAdminToken()

  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Video | null>(null)

  // Admin upload form state
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function loadVideos() {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('[videos] load failed', error)
    setVideos(data ?? [])
  }

  // Initial fetch
  useEffect(() => {
    let active = true
    ;(async () => {
      await loadVideos()
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  // Catch up when returning from a backgrounded tab / locked phone.
  useRefetchOnVisible(loadVideos)

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('videos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'videos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVideos((current) => {
              const incoming = payload.new as Video
              if (current.some((v) => v.id === incoming.id)) return current
              return [incoming, ...current]
            })
          } else if (payload.eventType === 'DELETE') {
            const removed = payload.old as { id: string }
            setVideos((current) => current.filter((v) => v.id !== removed.id))
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Video
            setVideos((current) =>
              current.map((v) => (v.id === updated.id ? updated : v)),
            )
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Capture the form BEFORE any await — React nulls currentTarget after the
    // synchronous part of the handler returns.
    const form = event.currentTarget
    if (!uploadFile || !uploadTitle.trim() || !adminToken) return

    if (uploadFile.size > MAX_FILE_BYTES) {
      setUploadError(
        `File is ${formatFileSize(uploadFile.size)} — Supabase free tier caps uploads at 50 MB. Export at a smaller size and try again.`,
      )
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const originalName = uploadFile.name.replace(/[^a-z0-9.-]/gi, '_')
      const storagePath = `${Date.now()}_${originalName}`

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, uploadFile, {
          contentType: uploadFile.type || 'video/mp4',
          upsert: false,
        })
      if (uploadErr) throw uploadErr

      const { error: rpcErr } = await supabase.rpc('add_video', {
        p_title: uploadTitle.trim(),
        p_storage_path: storagePath,
        admin_token: adminToken,
      })
      if (rpcErr) {
        // Try to clean up the orphaned storage object if the DB row failed.
        await supabase.storage.from(BUCKET).remove([storagePath])
        throw rpcErr
      }

      setUploadTitle('')
      setUploadFile(null)
      form.reset()
    } catch (err) {
      console.error('[videos] upload failed', err)
      setUploadError(
        err instanceof Error ? err.message : 'Upload failed. Try again.',
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(video: Video) {
    if (!adminToken) return
    if (!window.confirm(`Delete "${video.title}"? This can't be undone.`)) return

    const { error: rpcErr } = await supabase.rpc('delete_video', {
      video_id: video.id,
      admin_token: adminToken,
    })
    if (rpcErr) {
      console.error('[videos] delete rpc failed', rpcErr)
      return
    }
    // Best-effort storage cleanup — leaves orphan if it fails, not critical.
    await supabase.storage.from(BUCKET).remove([video.storage_path])
  }

  return (
    <section id="video" className="max-w-5xl mx-auto px-4 py-12">
      <h2 className="text-center mb-2">The Footage</h2>
      <p className="text-center text-ink-soft text-lg mb-8">
        A highlight reel from the morning. Tap any card to watch.
      </p>

      {isAdmin && (
        <DoodleCard className="relative mb-6">
          <Tape color="pink" position="top-left" />
          <Tape color="yellow" position="bottom-right" />
          <h3 className="mb-4">Upload a video</h3>
          <form onSubmit={handleUpload} className="space-y-3">
            <input
              type="text"
              placeholder="Title (e.g., Morning hellos)"
              value={uploadTitle}
              onChange={(event) => setUploadTitle(event.target.value)}
              className="doodle-border-alt w-full px-3 py-2 bg-paper text-lg"
              disabled={uploading}
              maxLength={120}
            />
            <input
              type="file"
              accept="video/*"
              onChange={(event) =>
                setUploadFile(event.target.files?.[0] ?? null)
              }
              className="doodle-border-alt w-full px-3 py-2 bg-paper text-base file:mr-4 file:py-1 file:px-3 file:doodle-border-alt file:bg-accent-2 file:text-ink file:font-doodle file:text-base"
              disabled={uploading}
            />
            {uploadFile && (
              <p className="text-sm text-ink-soft">
                {uploadFile.name} · {formatFileSize(uploadFile.size)}
                {uploadFile.size > MAX_FILE_BYTES && (
                  <span className="text-accent"> (over 50 MB limit)</span>
                )}
              </p>
            )}
            {uploadError && (
              <p className="text-sm text-accent">{uploadError}</p>
            )}
            <div className="flex justify-end">
              <DoodleButton
                type="submit"
                disabled={
                  uploading || !uploadTitle.trim() || !uploadFile
                }
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </DoodleButton>
            </div>
          </form>
        </DoodleCard>
      )}

      {loading ? (
        <p className="text-center text-ink-soft">Loading videos…</p>
      ) : videos.length === 0 ? (
        <DoodleCard className="relative text-center">
          <Tape color="blue" position="top-left" />
          <Tape color="pink" position="bottom-right" />
          <div className="aspect-video bg-paper-dark doodle-border-alt grid place-items-center p-6">
            <p className="font-display text-3xl md:text-4xl">
              No videos yet. Goofball's phone is in his pocket.
            </p>
          </div>
        </DoodleCard>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <li key={video.id} className="relative">
              <button
                type="button"
                onClick={() => setSelected(video)}
                className="block w-full text-left doodle-border-alt doodle-shadow bg-paper overflow-hidden transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                <div className="relative aspect-video bg-ink">
                  <video
                    src={getPublicUrl(video.storage_path)}
                    preload="metadata"
                    muted
                    playsInline
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <span
                      aria-hidden="true"
                      className="text-6xl md:text-7xl drop-shadow-[0_3px_0_rgba(0,0,0,0.7)] text-paper"
                    >
                      ▶
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-display text-2xl leading-tight">
                    {video.title}
                  </p>
                </div>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDelete(video)}
                  aria-label={`Delete ${video.title}`}
                  className="absolute top-2 right-2 doodle-border-alt bg-paper hover:bg-accent hover:text-paper px-2 py-0.5 text-base leading-none transition-colors"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <DoodleModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title}
      >
        {selected && (
          <div className="space-y-3">
            <video
              src={getPublicUrl(selected.storage_path)}
              controls
              playsInline
              autoPlay
              className="block mx-auto max-w-full max-h-[70dvh] doodle-border-alt bg-ink"
            />
            <p className="text-sm text-ink-soft">
              Uploaded {new Date(selected.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </DoodleModal>
    </section>
  )
}
