# FlexSACCO Uganda — 7-Stage Execution Mapping & Dependency Blueprint

This document provides the complete end-to-end technical mapping of the seven implementation stages for **FlexSACCO Uganda** against the master project specification, architectural invariants, and verification gates.

---

## 1. Architectural Principles & Non-Negotiable Invariants

Before executing any stage, four non-negotiable architectural rules govern the system:

1. **Multi-Tenant Isolation:** Every tenant table contains a foreign key `sacco_id UUID REFERENCES saccos(id)`. Access must be filtered at the database level using Supabase Row Level Security (RLS) via the helper `get_auth_sacco_id()`.
2. **Zero Cross-Tenant Payment Leaks:** Dedicated `iotec_wallet_id` per SACCO. Incoming webhook payloads from ioTec Pay must validate that `payload.walletId === sacco.iotec_wallet_id`. Any mismatch must trigger a 403 error without altering account balances.
3. **Zero-Cost Member Activation (Years 0–2):** No paid telecom SMS gateways may be called during initial operations. Member activation is executed via WhatsApp deep-linking (`wa.me`), in-branch printable activation slips (8 per A4 sheet), or self-service NIN + Phone claiming on `/claim-account`.
4. **Double-Entry Balancing Ledger:** Every approved financial transaction must generate atomic, balancing debit and credit entries with strict currency formatting in Ugandan Shillings (UGX).

---

## 2. Stage-by-Stage Dependency Flowchart

```text
[Stage 01: Foundation, DB Schema, RLS & Auth Guards]
         │
         ▼
[Stage 02: Super Admin Cockpit & SACCO Provisioning]
         │
         ▼
[Stage 03: Bulk Member Onboarding & Zero-Cost Activation]
         │
         ▼
[Stage 04: Staff Workspace (Operations, KYC & Loan Pipeline)]
         │
         ▼
[Stage 05: Member Portal (PWA Self-Service & Offline Cache)]
         │
         ▼
[Stage 06: ioTec Pay Engine & Non-Interfering Ledger Firewall]
         │
         ▼
[Stage 07: In-App Realtime Alerts, SMS Adapter & E2E Hardening]
```

---

## 3. Comprehensive Stage Mapping Matrix

| Stage | Spec & Directory Mapping | Core Deliverables | Prerequisites (What It Depends On) | Gate Criteria & Definition of Done |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 01: Foundation, Multi-Tenant Database & Auth Setup** | Spec §2, §3 (Rule 1), `supabase/migrations/001_initial_schema.sql` | • Next.js App Router & Tailwind setup with cooperative green palette (`#063A2F`, `#0D7A5F`).<br>• Core PostgreSQL schema: `saccos`, `profiles`, `accounts`, `loans`, `transactions`, `notifications`.<br>• RLS policies with `get_auth_sacco_id()`.<br>• Middleware role-based route guards (`super_admin`, `sacco_admin`, `sacco_staff`, `member`). | External Supabase project provisioned in Cape Town (`af-south-1`) or Frankfurt (`eu-central-1`). | • TypeScript compilation succeeds with zero errors (`npm run build`).<br>• Role route guards prevent unauthorized access (`member` blocked from `/admin` and `/workspace`).<br>• Cross-tenant query verification: User in SACCO A cannot read rows from SACCO B. |
| **Stage 02: Platform Super Admin & SACCO Provisioning** | Spec §1 (Platform Provider), `app/(platform-admin)/admin` | • Super Admin cockpit (`/admin`): SaaS subscription revenue, active tenants, system health.<br>• "Onboard New SACCO" workflow: provisions tenant row, generates unique `iotec_wallet_id`, and creates initial `sacco_admin`.<br>• Direct CSV export endpoint (`GET /api/admin/export/saccos`). | **Stage 01** (Auth system, `super_admin` role guard, base tables). | • Creating a SACCO writes to `saccos` with a dedicated `iotec_wallet_id`.<br>• Platform metrics accurately aggregate active tenants and revenue.<br>• Direct CSV export delivers valid headers (`Content-Disposition: attachment`). |
| **Stage 03: Bulk Member Onboarding & Zero-Cost Activation** | Spec §3 (Rule 3), Table `profiles`, Table `accounts`, `/claim-account` | • CSV template download endpoint (`/api/workspace/members/template`).<br>• Phone normalizer (`256...`) and 14-character Ugandan NIN validator.<br>• Atomic batch account creation (Savings & Share Capital).<br>• WhatsApp `wa.me` activation link generator.<br>• Printable A4 8-slip PDF generator.<br>• Public `/claim-account` self-service claiming with PIN setup. | **Stage 01** (`profiles`, `accounts`), **Stage 02** (Active SACCO tenant with an authorized `sacco_admin` to execute imports). | • 5 Stage Checks pass: Phone/NIN sanitization, multi-tenant bulk isolation, zero-SMS network invariant (`NoopSmsProvider`), direct download headers, and claim idempotency (cannot re-claim active member).<br>• Unactivated member can claim account on `/claim-account` with zero SMS sent. |
| **Stage 04: SACCO Staff Workspace (Branch Operations)** | Spec §2, `app/(sacco-staff)/workspace`, wireframe Image 1 | • Staff cockpit matching Kampala SACCO wireframe: 4 KPI metric cards, financial trends chart, member/loan distribution donut, recent transactions table, pending approvals queue.<br>• KYC verification desk (`Approve`/`Reject` with document preview).<br>• Loan appraisal pipeline with 3.0x debt-to-savings ratio check.<br>• Direct CSV/PDF download endpoints for transactions, loan book, and repayment schedules. | **Stage 01** (Staff auth), **Stage 02** (SACCO tenant context), **Stage 03** (Populated member records, accounts, and KYC docs). | • 5 Stage Checks pass: Staff multi-tenant boundary, KYC pre-condition invariant (cannot disburse to unverified member), loan appraisal ratio warning, direct download headers, and reactive approvals queue triage. |
| **Stage 05: Member Portal (PWA & Self-Service)** | Spec §1 (Member Access), `app/(member-portal)/portal`, wireframe Image 4 | • Mobile-first self-service portal (`/portal`) matching John Muganzi wireframe: Savings/Shares donut, loan repayment tracker ("8 of 12 payments"), loan application wizard with amortization calculation.<br>• KYC upload modal targeting Supabase Storage bucket `kyc-documents`.<br>• PWA `manifest.json` with standalone mode and in-app "Install App" button.<br>• Direct statement download endpoint (`/api/portal/export/statement`). | **Stage 01** (Member auth & RLS), **Stage 03** (Activated member credentials), **Stage 04** (Configured loan products & KYC storage bucket). | • 5 Stage Checks pass: Member RLS isolation (100% rows scoped to `auth.uid()`), PWA manifest and service worker installability on 360px–428px widths, loan progress math check (66.67%), direct PDF/CSV statement download, and unverified KYC loan block. |
| **Stage 06: ioTec Pay Payment Engine & Ledger Firewall** | Spec §2 (Payments), §3 (Rule 2 & 4), `lib/iotec/client.ts`, `/api/webhooks/iotec` | • ioTec Pay OAuth 2.0 client (`id.iotec.io`) with in-memory token cache.<br>• MTN MoMo and Airtel Money collection & disbursement client (`pay.iotec.io`).<br>• Secure webhook receiver (`/api/webhooks/iotec`) validating secret header and tenant wallet firewall (`payload.walletId === sacco.iotec_wallet_id`).<br>• Atomic balance update stored procedure (`complete_deposit_transaction`).<br>• Direct CSV reconciliation export. | **Stage 01** (`transactions`, DB stored procedures), **Stage 02** (Tenant `iotec_wallet_id`), **Stage 04** (Staff reconciliation), **Stage 05** (Member deposit/repayment UI triggers). | • 5 Stage Checks pass: Tenant wallet firewall invariant (mismatched `walletId` returns 403 and leaves ledger untouched), webhook secret header verification, atomic double-entry balance update, MoMo minimum amount validation (>= 500 UGX), and reconciliation export. |
| **Stage 07: In-App Alerts, SMS Adapter & Production Hardening** | Spec §2 (Realtime), Table `notifications`, §3 (Rule 3), audit trails | • Real-time `NotificationBell.tsx` using Supabase Realtime WebSocket subscription (`INSERT` on `notifications`).<br>• Pluggable `NoopSmsProvider` interface logging to DB audit table (zero cost, switchable to `AfricasTalkingProvider` via `.env` in Years 2–4).<br>• UMRA regulatory audit trail direct export.<br>• End-to-end smoke test suite covering SACCO onboarding through loan payoff. | **Stages 01–06** (All business triggers active: member claimed, loan approved, MoMo deposit received, KYC verified). | • Realtime WebSocket increments notification badge live without page reload.<br>• Zero paid SMS calls verified under default config.<br>• End-to-end smoke test passes full lifecycle from SACCO onboarding to member deposit and loan payoff. |

---

## 4. Key Execution Rules for Antigravity & Development Agents

1. **One Stage at a Time:** Do not initiate a subsequent stage until all five mandatory checks of the current stage have executed and passed.
2. **Direct Download Enforcing:** Every export endpoint must stream files using `Content-Disposition: attachment; filename="..."` headers rather than opening raw preview windows.
3. **Responsive Mobile Testing:** Stage 05 must be validated against responsive viewport widths between 360px and 428px to ensure field accessibility across common Ugandan Android smartphones.
4. **Environment Isolation:** Keep all ioTec and Supabase Service Role keys strictly in server-side environment variables and API routes, never leaking to client-side bundles.
