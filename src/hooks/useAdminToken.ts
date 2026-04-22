import { useParams } from 'react-router-dom'

/**
 * Returns the admin slug from the current URL (/admin/:slug), or null if we're
 * on a public route. The slug is passed verbatim to Supabase RPC calls, which
 * validate it server-side against admin_secrets.slug.
 */
export function useAdminToken(): string | null {
  const { slug } = useParams<{ slug: string }>()
  return slug ?? null
}
