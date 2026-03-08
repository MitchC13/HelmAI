-- ============================================================
-- Integration Tokens
-- Stores OAuth tokens for third-party integrations.
-- RLS is enabled but NO policies are added, so the authenticated
-- role cannot read or write this table at all.
-- All access goes through the service role (server-only).
-- ============================================================

create table public.integration_tokens (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider        text not null,
  access_token    text not null,
  refresh_token   text,
  token_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, provider)
);

create index integration_tokens_org_provider_idx
  on public.integration_tokens (organization_id, provider);

create trigger integration_tokens_updated_at
  before update on public.integration_tokens
  for each row execute procedure public.set_updated_at();

-- Enable RLS — zero policies means zero authenticated access.
-- Service role bypasses RLS and is the only way to read/write here.
alter table public.integration_tokens enable row level security;
