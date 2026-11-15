/*
# Create AI meeting workspace storage

1. New Tables
- `projects` stores project names, client context, progress summaries, open issues, and health status for the workspace dashboard.
- `meetings` stores scheduled Google Meet briefings, attendees, agenda, meeting status, and generated briefing notes.

2. Security
- Enable row-level security on both tables.
- Grant CRUD access to anon and authenticated because this MVP has no sign-in screen and is intentionally single-tenant.
- Add separate policies for each CRUD operation.

3. Important Notes
- This migration is designed for an MVP workspace without user accounts.
- Meeting records reference projects and are retained when a project is removed only through the explicit cascade relationship.
*/

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  progress_summary text NOT NULL DEFAULT '',
  open_issues text NOT NULL DEFAULT '',
  health text NOT NULL DEFAULT 'On track',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  meeting_at timestamptz NOT NULL,
  meet_url text NOT NULL DEFAULT '',
  attendees text NOT NULL DEFAULT '',
  agenda text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Scheduled',
  briefing text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read projects" ON public.projects;
CREATE POLICY "Public can read projects" ON public.projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create projects" ON public.projects;
CREATE POLICY "Public can create projects" ON public.projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update projects" ON public.projects;
CREATE POLICY "Public can update projects" ON public.projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete projects" ON public.projects;
CREATE POLICY "Public can delete projects" ON public.projects FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can read meetings" ON public.meetings;
CREATE POLICY "Public can read meetings" ON public.meetings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create meetings" ON public.meetings;
CREATE POLICY "Public can create meetings" ON public.meetings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update meetings" ON public.meetings;
CREATE POLICY "Public can update meetings" ON public.meetings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete meetings" ON public.meetings;
CREATE POLICY "Public can delete meetings" ON public.meetings FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS meetings_project_id_idx ON public.meetings(project_id);
CREATE INDEX IF NOT EXISTS meetings_meeting_at_idx ON public.meetings(meeting_at);
