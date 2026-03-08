-- ============================================================
-- HelmAI — Initial Schema
-- ============================================================
-- Tables:
--   profiles            — per-user data extending auth.users
--   organizations       — top-level tenant (team/company)
--   organization_members — user ↔ org membership with role
--   tone_profiles       — core HelmAI entity: saved tone configs
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type public.org_role as enum ('owner', 'admin', 'member');

-- ------------------------------------------------------------
-- profiles
-- One row per auth.users entry, created automatically on signup.
-- ------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- organizations
-- Top-level tenant entity. Each org owns its own data.
-- ------------------------------------------------------------
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- organization_members
-- Junction table: which users belong to which org, and their role.
-- ------------------------------------------------------------
create table public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            public.org_role not null default 'member',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_org_id_idx  on public.organization_members (organization_id);
create index organization_members_user_id_idx on public.organization_members (user_id);

-- ------------------------------------------------------------
-- tone_profiles
-- Core HelmAI entity. Stores named tone configurations per org.
-- config (jsonb) holds flexible tone parameters — expanded in Phase 5.
-- ------------------------------------------------------------
create table public.tone_profiles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by      uuid not null references auth.users (id) on delete set null,
  name            text not null,
  description     text,
  config          jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tone_profiles_org_id_idx on public.tone_profiles (organization_id);

create trigger tone_profiles_updated_at
  before update on public.tone_profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.organizations       enable row level security;
alter table public.organization_members enable row level security;
alter table public.tone_profiles       enable row level security;

-- ------------------------------------------------------------
-- Helper: is the current user a member of a given org?
-- ------------------------------------------------------------
create or replace function public.is_org_member(org_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

-- Helper: does the current user have at least admin role in an org?
create or replace function public.is_org_admin(org_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

-- ------------------------------------------------------------
-- profiles policies
-- Users can read any profile (needed for display names).
-- Users can only update their own profile.
-- ------------------------------------------------------------
create policy "profiles: read any"
  on public.profiles for select
  using (true);

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid());

-- ------------------------------------------------------------
-- organizations policies
-- Members can read their org. Only owners/admins can update.
-- ------------------------------------------------------------
create policy "organizations: read if member"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "organizations: update if admin"
  on public.organizations for update
  using (public.is_org_admin(id));

-- ------------------------------------------------------------
-- organization_members policies
-- Members of an org can see who else is in it.
-- Only owners/admins can insert or delete members.
-- ------------------------------------------------------------
create policy "org_members: read if member"
  on public.organization_members for select
  using (public.is_org_member(organization_id));

create policy "org_members: insert if admin"
  on public.organization_members for insert
  with check (public.is_org_admin(organization_id));

create policy "org_members: delete if admin"
  on public.organization_members for delete
  using (public.is_org_admin(organization_id));

-- ------------------------------------------------------------
-- tone_profiles policies
-- Any org member can read tone profiles.
-- Only admins/owners can create, update, or delete them.
-- ------------------------------------------------------------
create policy "tone_profiles: read if member"
  on public.tone_profiles for select
  using (public.is_org_member(organization_id));

create policy "tone_profiles: insert if admin"
  on public.tone_profiles for insert
  with check (public.is_org_admin(organization_id));

create policy "tone_profiles: update if admin"
  on public.tone_profiles for update
  using (public.is_org_admin(organization_id));

create policy "tone_profiles: delete if admin"
  on public.tone_profiles for delete
  using (public.is_org_admin(organization_id));
