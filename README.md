# Superloser Tracker

A one-off web app that lets my brother and sister-in-law watch live as I take
care of their pets Thursday morning. Features a fake contract, a live task
tracker with animated icons, uploaded/live video footage, and a comment
section.

Stack: **Vite + React + TypeScript + Tailwind v4 + Framer Motion + Supabase**.

## Getting started

```bash
cp .env.example .env.local   # then fill in your Supabase values
npm install
npm run dev
```

Routes:

- `/` — public read-only site.
- `/admin/<secret-slug>` — admin mode; enables task toggles, video uploads,
  and sitter-badged comments. The slug is validated server-side inside
  Postgres RPCs against the `admin_secrets.slug` value, so a wrong slug just
  makes mutations fail. Not linked anywhere in the UI.

## What still needs wiring up

See the build plan at `~/.claude/plans/hi-claude-i-have-sleepy-aho.md`. At
scaffold time we have the UI shell, doodle styling, and placeholder data.
Still to do: Supabase project + tables + RLS + RPCs, realtime hooks on tasks
and comments, and the video upload/embed flow.

## Deploy (Coolify + Hetzner)

- Build: `npm run build` → static files land in `dist/`.
- Serve with nginx via Coolify's static-site buildpack or a simple Dockerfile.
- Coolify env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
