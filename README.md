# FlexSACCO (Security-first Stage 1 foundation)

This repository now contains a minimal security-first Next.js foundation for FlexSACCO. It is intentionally built in a conservative way and does not assume live financial data or production secrets.

## Stack

- Next.js App Router
- TypeScript
- Tailwind
- Supabase Auth and JS client
- Middleware-based route protection placeholder

## Key security decisions

- Public routes stay public.
- Protected routes are gated by server-side checks and cannot rely solely on client-side UI.
- Tenant-aware logic is explicitly separated from request data.
- The `supabase/migrations/001_initial_schema.sql` file contains a safer default-deny foundation for role and tenant isolation.

## Environment setup

Copy `.env.example` to `.env.local` and fill real Supabase values before running the app.

## Install and run

```bash
npm install
npm run dev
```

## Important notes

This project is Stage 1 only. Do not use real user data or production payment credentials until the following are completed:

- full RLS review for every table
- MFA + session controls
- tenant onboarding review
- payment provider sandbox validation
- independent security review

## Next recommended step

Implement the actual Supabase-authenticated session flow with an admin/staff/member profile check and then move to the onboarding and payment security review for later stages.
