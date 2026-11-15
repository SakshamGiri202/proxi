/*
# Add project source links

1. Modified Tables
- `projects.github_url` stores the repository link that gives Proxi technical context.
- `projects.management_url` stores the project-management or issue-tracking link used by the team.

2. Security
- Existing row-level security, grants, and public single-tenant CRUD policies remain in place.
- No data is removed or changed; both fields are optional and default to an empty string.

3. Important Notes
- These fields are reference links only in this MVP. They are saved with the project so a future secure server-side connector can read them.
*/

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS github_url text NOT NULL DEFAULT '';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS management_url text NOT NULL DEFAULT '';
