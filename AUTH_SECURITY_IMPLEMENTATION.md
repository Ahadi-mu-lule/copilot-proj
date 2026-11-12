# FlexSACCO authentication and security implementation

This document is the implementation contract for authentication, authorization, and session security in FlexSACCO. It complements `project spec.md` and Stage 01. The repository currently contains specifications rather than an application implementation, so these steps must be applied and tested as the app is scaffolded.

> **Financial safety:** Do not connect this application to live payment credentials or real member funds until the security acceptance tests in this guide pass, the payment ledger is independently reviewed, and a production security review has been completed.

## 1. Security objectives and trust boundaries

- Supabase Auth authenticates identities. The database `profiles` row supplies the application role and tenant (`sacco_id`). Never accept either value from browser input, URL parameters, or user-editable metadata.
- PostgreSQL Row Level Security (RLS) is the authoritative data access boundary. Next.js middleware is for user experience and route gating, not a substitute for RLS or server-side authorization.
- The Supabase service-role key bypasses RLS. Use it only in narrowly scoped server-only administrative jobs and verified webhooks; never in a browser bundle, Server Component that can serialize it, or user-facing request path where an RLS-scoped client is sufficient.
- Financial writes are performed through validated server operations and atomic database functions, never direct client updates to balances or journal entries.
- Default deny: a missing profile, unknown role, suspended tenant, or failed security check must not grant access.

## 2. Identity and role model

Roles: `super_admin`, `sacco_admin`, `sacco_staff`, and `member`.

Store role and tenant association in protected database tables. Do not copy mutable role data into user-editable `user_metadata`. Do not authorize using `app_metadata` as the sole source unless role changes are designed to invalidate/revoke existing sessions and the design is reviewed. For each request, obtain the authenticated user from the Supabase server client and read the authoritative profile using an RLS-protected or narrowly scoped server-side query.

Recommended route access:

| Route prefix | Allowed role |
| --- | --- |
| `/admin` | `super_admin` |
| `/workspace` | `sacco_admin`, `sacco_staff` |
| `/portal` | `member` |
| `/login`, `/claim-account`, `/auth/callback` | unauthenticated or the documented auth flow |

A super admin should use separate, auditable platform-admin operations rather than being silently treated as a tenant user. Staff permissions should be split further by action where appropriate (e.g. loan review, approval, disbursement); a single `sacco_staff` role should not automatically authorize every financial action.

## 3. Supabase Auth configuration

Configure Supabase Auth for the deployment domain and exact allowed redirect URLs. Use HTTPS in production. Enable email/phone verification for the selected login method, strong password policy for password-based users, breached-password protection if available on the selected plan, and MFA for administrators and staff. Prefer TOTP-based MFA for privileged users. Require a second-factor/step-up check for role changes, bank/wallet changes, loan approvals, and high-value disbursements.

Never use a four-digit PIN as the sole authentication factor for access to financial accounts. If a PIN is used for a narrowly scoped convenience feature, protect it with server-side rate limits, secure hashing, lockouts, and a stronger step-up challenge for financial actions.

### Account claim flow

The existing concept of claiming an account using phone + NIN alone is not sufficient proof of identity. Implement claim as a server-only, one-time enrollment flow:

1. Staff creates an inactive member record from a trusted onboarding process. Do not expose a lookup endpoint that confirms whether a phone/NIN exists.
2. Generate a cryptographically random, high-entropy, short-lived activation token using a trusted server-side crypto API. Store only a hash of the token, its expiration, and a used/revoked marker. Never store or print a temporary password/PIN.
3. Deliver the link through a verified channel approved by the SACCO. If the project cannot send a verified code, require in-person verification by authorized staff; a WhatsApp deep link must not itself be treated as proof of ownership.
4. Exchange the token once, with rate limiting and generic error responses. Require verified Supabase Auth phone/email ownership and any approved additional identity check before linking the auth user to the profile.
5. In one database transaction, mark the token used and bind the profile to the authenticated user. Enforce uniqueness and tenant consistency. Replays and expired tokens fail.
6. Record the enrollment in an audit log, excluding the token, NIN, OTP, and credentials.

Do not put NINs, activation tokens, OTPs, temporary credentials, or account balances in URLs, analytics, console logs, WhatsApp message text, or client-visible error messages. Mask NIN in user interfaces and restrict KYC access.

## 4. Server-side Supabase clients and authorization

Use `@supabase/ssr` clients with the official cookie adapter pattern for the installed Next.js version. Keep browser and server clients in separate modules. On every protected server page/action/API route:

1. Create a request-scoped server Supabase client.
2. Call `auth.getUser()` to validate the current identity; do not rely only on an unverified cookie or `getSession()` result for authorization.
3. Load the user's profile and check that it exists, is active, and has an allowed role and tenant.
4. Perform data access using the request-scoped user client so RLS remains active.
5. Validate all input on the server and derive `sacco_id`, `member_id`, and role from trusted server/database state—not request payloads.
6. Return generic authorization errors without leaking whether another tenant's record exists.

Create shared helpers such as `requireUser()`, `requireRole(roles)`, and `requireSaccoAccess(saccoId)` only if they run server-side and fail closed. Do not import server-only secrets or service-role clients into shared modules or client components. Mark secret-bearing modules with Next.js `server-only` where applicable.

## 5. Middleware behavior

Middleware may refresh Supabase cookies and redirect obvious unauthenticated or unauthorized page navigation. It must not be the only authorization control. Avoid broad database work in middleware; fetch authoritative role/tenant in server layouts/actions where possible. If middleware uses claims for an early redirect, every protected data operation must independently verify the user and role. Do not trust a role supplied as a query parameter or client-side state.

Required behavior:

- Unauthenticated browser navigation to protected pages redirects to login with a safe, same-origin return path.
- Unknown/missing profile, disabled account, or unknown role is denied and logged safely.
- Authenticated users accessing another role's route are redirected to an unauthorized page or their own landing page.
- API routes and Server Actions return `401`/`403`; redirects are not authorization for API calls.
- Callback and return URLs are validated against an allowlist to prevent open redirects.

## 6. Database security and RLS

Enable RLS on every table reachable through Supabase APIs, including future KYC documents, audit events, activation records, and ledger tables. Revoke broad grants where appropriate and define policies for each operation (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) explicitly. For writes, use `WITH CHECK` as well as `USING`. Start with no policies and add only required access.

Database safeguards:

- A profile's `role` and `sacco_id` must never be directly writable by that user. Provision role changes through a restricted administrative function with authorization and audit logging.
- Members may read only their own allowed profile fields, accounts, loans, transactions, and notifications. Use a safe view or column-level approach so sensitive KYC fields are not exposed through broad profile reads.
- SACCO staff/admin access is restricted to their own `sacco_id`; enforce role and tenant checks in the database.
- Do not let browser clients insert completed transactions or modify balances, status, ledger entries, approval fields, wallet IDs, or tenant IDs.
- Use composite foreign keys to ensure referenced member/account/loan rows belong to the same SACCO. A `sacco_id` check in application code alone is insufficient.
- Any `SECURITY DEFINER` function must set a fixed safe `search_path`, fully qualify referenced objects, validate `auth.uid()`/permissions as applicable, expose only necessary arguments, and have `EXECUTE` revoked from `PUBLIC` unless explicitly granted.
- Service-role operations bypass RLS; minimize their use and validate every identifier/tenant relationship explicitly.

The current blueprint's `get_auth_sacco_id()` function is `SECURITY DEFINER` without a pinned `search_path`, and the listed policies do not cover all tables or write checks. Treat the existing SQL as a draft, not as a complete production RLS configuration. Write and test a reviewed migration before deployment.

## 7. Session and browser security

Use Supabase's supported session cookie integration. In production, require HTTPS and secure cookies. Use `HttpOnly`, `Secure`, and an appropriate `SameSite` policy for any custom cookies. Do not put access or refresh tokens in `localStorage`, logs, or URLs. Configure session lifetimes and refresh behavior deliberately; revoke sessions on account disablement, role change, suspected compromise, and password reset where supported.

Add a Content Security Policy and standard security headers (for example `X-Content-Type-Options: nosniff`, an appropriate `Referrer-Policy`, and frame restrictions). Start CSP in report-only mode if needed, then enforce after validating the app. Avoid unsafe inline script allowances where possible. Escape/render user content safely; do not render untrusted HTML.

For state-changing requests, use the framework's protections and validate origin where appropriate. Apply CSRF defenses to cookie-authenticated operations, especially any custom route that accepts cross-site browser requests. Use `SameSite` as a layer, not the only control.

## 8. Abuse controls and privileged actions

Apply server-side rate limits to login/claim attempts, OTP verification, password reset, sensitive search, payment initiation, exports, and webhook endpoints. Use a shared/distributed limiter for serverless deployments; an in-memory counter is not sufficient. Return generic authentication/claim failures and introduce progressive delays or temporary lockouts without enabling easy denial of service against other users.

Require re-authentication/MFA for privileged changes. Use dual control (maker/checker) for high-value loan approval, disbursement, bank account changes, and manual ledger adjustments. Enforce limits and allowed state transitions in the database, not just the UI. Never permit a user to approve their own request where separation of duties is required.

## 9. Audit logging and privacy

Create append-only, access-restricted audit events for sign-in/security events and sensitive business actions: role changes, member claims, KYC access/changes, loan approvals, disbursements, payment status changes, exports, and bank/wallet changes. Capture actor ID, tenant ID, action, target record ID, timestamp, outcome, and a request/correlation ID. Avoid recording passwords, tokens, OTPs, full NINs, payment secrets, or unnecessary personal data. Restrict audit-log reads to authorized reviewers and alert on suspicious activity.

## 10. Required tests and release gates

Automate tests using at least two SACCO tenants and multiple roles. Run against a non-production Supabase project with realistic RLS enabled.

- Anonymous requests cannot read protected data or call protected mutations.
- A member cannot read or change another member's data, including by swapping UUIDs.
- A user in SACCO A cannot read or modify SACCO B data through direct API/SQL client operations.
- Staff cannot promote themselves, change tenant assignment, or invoke platform-admin functions.
- A member cannot create a completed transaction or update any balance or ledger entry.
- Missing/deactivated profiles and unknown roles fail closed.
- Expired, reused, revoked, or guessed claim tokens fail; claims cannot disclose whether a person is registered.
- MFA/step-up is enforced for designated privileged actions.
- API authorization is tested independently of middleware/page rendering.
- Cross-tenant composite foreign key violations are rejected.
- Secrets are absent from client bundles, Git history, logs, and error responses.

Release gates: migration reviewed; RLS tests pass; dependency/secret scanning enabled in CI; backup restore tested; production secrets rotated and stored outside Git; HTTPS and security headers verified; incident contact and response procedure documented. Do not describe the system as production-ready solely because the build succeeds.

## 11. Implementation order

1. Remove or replace the insecure NIN+phone-only claim and plaintext activation-token design.
2. Define profile provisioning and controlled role/tenant assignment.
3. Implement Supabase SSR clients, `requireUser`/role checks, and server-side validation.
4. Write complete default-deny RLS and tenant-consistency constraints; test against two tenants.
5. Add MFA, session revocation, rate limiting, secure headers, and audit events.
6. Secure privileged/financial actions with step-up authentication and maker/checker controls.
7. Complete the payment webhook and atomic-ledger review as a separate release gate before live credentials.

## 12. Configuration checklist

Set secrets only in deployment secret settings (and local ignored `.env.local` for development):

- `NEXT_PUBLIC_SUPABASE_URL` — public project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public/anonymous key; RLS is still mandatory.
- `SUPABASE_SERVICE_ROLE_KEY` — secret; server-only, least use, rotate after exposure.
- Provider credentials and webhook secrets — server-only, rotate, never commit.

Add `.env.local`, `.env.*.local`, and other secret-bearing files to `.gitignore`; commit a `.env.example` containing placeholder values only. If any real credential has ever been committed, revoke/rotate it immediately; deleting the file in a later commit does not remove it from Git history.

## Implementation status

This repository is a project blueprint and does not currently contain the Next.js application source or Supabase migration files as actual implementation files. Apply these controls when scaffolding the app. The guide is a security design baseline, not a certification or guarantee against compromise; arrange an independent review before handling real funds or sensitive production data.
