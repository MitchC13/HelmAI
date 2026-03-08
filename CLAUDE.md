# CLAUDE.md — HelmAI Project Guide

## Project Overview

HelmAI is a SaaS application built with the following stack:

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database & Auth**: Supabase
- **AI**: Anthropic API (Claude)
- **Billing**: Stripe
- **Email**: Resend
- **Rate Limiting / Caching**: Upstash Redis
- **Automation**: N8N
- **Hosting**: Vercel

---

## Development Rules

- Build one phase at a time. Do not skip ahead.
- Do not refactor files unrelated to the current task.
- Do not add features beyond what is explicitly requested.
- After each phase, explain exactly what changed and why.
- Keep solutions simple. Prefer editing existing files over creating new ones.
- Never commit secrets or `.env` files.

---

## Build Phases

### Phase 1 — Project Scaffold
- Initialize Next.js 14 with App Router and TypeScript
- Add ESLint, Prettier, Tailwind CSS
- Create `.env.local.example` (template, never `.env.local` itself)
- Add `.gitignore`

### Phase 2 — Auth & Database
- Supabase project setup (schema, Row Level Security)
- Supabase Auth (email/password, OAuth)
- `users` and `profiles` tables

### Phase 3 — Core UI Shell
- Layout, navigation, protected routes
- Dashboard skeleton
- Component library setup (shadcn/ui or equivalent)

### Phase 4 — Billing
- Stripe checkout, webhooks, subscription management
- Plan-based feature gating

### Phase 5 — AI Features
- Anthropic API integration
- Core HELM AI feature implementation
- Upstash Redis for rate limiting

### Phase 6 — Email
- Resend integration
- Transactional emails (welcome, billing receipts, etc.)

### Phase 7 — Automation
- N8N webhook triggers and workflows

### Phase 8 — Deploy
- Vercel deployment configuration
- Production environment setup

---

## Environment Variables

Store secrets in `.env.local` (never committed). Use `.env.local.example` as the committed template.

Expected variables (to be filled per phase):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# N8N
N8N_WEBHOOK_URL=
```

---

## Git Conventions

- Branch: `claude/inspect-helm-repo-1OGB9`
- Commit messages: clear, lowercase, imperative (e.g. `add stripe webhook handler`)
- Never push to `main` or `master` directly

---

## Current Status

- [x] Phase 0 — Repository initialized, CLAUDE.md created
- [ ] Phase 1 — Project scaffold
- [ ] Phase 2 — Auth & Database
- [ ] Phase 3 — Core UI Shell
- [ ] Phase 4 — Billing
- [ ] Phase 5 — AI Features
- [ ] Phase 6 — Email
- [ ] Phase 7 — Automation
- [ ] Phase 8 — Deploy
