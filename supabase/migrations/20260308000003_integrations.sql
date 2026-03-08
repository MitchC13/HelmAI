-- ============================================================
-- Org Integrations
-- Stores per-org third-party integration records.
-- OAuth tokens and credentials are intentionally omitted here
-- and will be added in a later phase when flows are built.
-- ============================================================

create table public.org_integrations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider        text not null,                          -- e.g. 'gmail', 'slack'
  status          text not null default 'not_connected',  -- 'not_connected' | 'connected' | 'error'
  metadata        jsonb not null default '{}',            -- provider-specific data, expanded per phase
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, provider)                      -- one record per provider per org
);

create index org_integrations_org_id_idx on public.org_integrations (organization_id);

create trigger org_integrations_updated_at
  before update on public.org_integrations
  for each row execute procedure public.set_updated_at();

alter table public.org_integrations enable row level security;

-- Any org member can see which integrations are connected
create policy "org_integrations: read if member"
  on public.org_integrations for select
  using (public.is_org_member(organization_id));

-- Only admins/owners can create, update, or remove integrations
create policy "org_integrations: insert if admin"
  on public.org_integrations for insert
  with check (public.is_org_admin(organization_id));

create policy "org_integrations: update if admin"
  on public.org_integrations for update
  using (public.is_org_admin(organization_id));

create policy "org_integrations: delete if admin"
  on public.org_integrations for delete
  using (public.is_org_admin(organization_id));
