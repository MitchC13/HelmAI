-- ============================================================
-- Agent Runs
-- Stores per-org, per-user agent invocations and their output.
-- ============================================================

create table public.agent_runs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  agent_type      text not null,
  input           text not null,
  output          text,
  created_at      timestamptz not null default now()
);

create index agent_runs_org_id_idx  on public.agent_runs (organization_id);
create index agent_runs_user_id_idx on public.agent_runs (user_id);

alter table public.agent_runs enable row level security;

-- Any org member can read runs that belong to their org
create policy "agent_runs: read if member"
  on public.agent_runs for select
  using (public.is_org_member(organization_id));

-- Any org member can insert their own runs
create policy "agent_runs: insert if member"
  on public.agent_runs for insert
  with check (
    public.is_org_member(organization_id)
    and user_id = auth.uid()
  );

-- Users can only delete their own runs
create policy "agent_runs: delete own"
  on public.agent_runs for delete
  using (user_id = auth.uid());
