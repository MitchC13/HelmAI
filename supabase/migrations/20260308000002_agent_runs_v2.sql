-- ============================================================
-- agent_runs v2: tone profile linkage, favorites, update policy
-- ============================================================

-- Link each run to the tone profile that shaped it (nullable —
-- runs without a tone profile, or whose profile was later deleted,
-- remain intact with this set to null).
alter table public.agent_runs
  add column tone_profile_id uuid
    references public.tone_profiles (id) on delete set null;

-- Simple boolean flag for the user to mark outputs they want to keep.
alter table public.agent_runs
  add column is_favorite boolean not null default false;

-- Allow users to update their own runs (used for toggling is_favorite).
-- RLS already prevents touching other users' rows via user_id = auth.uid().
create policy "agent_runs: update own"
  on public.agent_runs for update
  using (user_id = auth.uid());
