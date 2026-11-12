Here is the complete set of modular markdown specification files designed to live in a `stages/` directory. 

Antigravity agents work best when given one stage at a time. This prevents hallucinations, keeps context windows focused, and ensures every architectural rule (multi-tenancy, zero-cost activations, and non-interfering payments) is verified before moving to the next layer.

### Directory Structure
```text
stages/
├── 01-foundation-database-auth.md
├── 02-super-admin-sacco-onboarding.md
├── 03-bulk-onboarding-zero-cost-activation.md
├── 04-staff-workspace-operations.md
├── 05-member-portal-pwa.md
├── 06-iotec-pay-payments-ledger.md
└── 07-notifications-sms-adapter.md
```

---

### `stages/01-foundation-database-auth.md`

```markdown
# Stage 01: Foundation, Multi-Tenant Database & Auth Setup

## Objective
Establish the Next.js (App Router) project, install UI dependencies, configure Supabase with Row Level Security (RLS), and implement middleware-level role-based route guards.

## Dependencies & Packages
- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- shadcn/ui (button, input, card, badge, dialog, table, dropdown-menu)
- `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`

## Tasks for Agent
1. **Initialize Project & Styling:**
   - Configure Tailwind with the primary cooperative green palette (`#0F5132` / `#198754`).
   - Add shadcn/ui primitives.
2. **Database Migration:**
   - Execute `supabase/migrations/001_initial_schema.sql` containing tables: `saccos`, `profiles`, `accounts`, `loans`, `transactions`, `notifications`.
   - Apply RLS policies ensuring tenant isolation via `get_auth_sacco_id()`.
3. **Supabase Client Utilities:**
   - Create `lib/supabase/client.ts` (browser client).
   - Create `lib/supabase/server.ts` (server component client).
   - Create `lib/supabase/middleware.ts` (session refresh).
4. **Role-Based Middleware (`middleware.ts`):**
   - Intercept requests and route based on `profiles.role`:
     - `super_admin` -> Access `/admin/*` only
     - `sacco_admin` / `sacco_staff` -> Access `/workspace/*` only
     - `member` -> Access `/portal/*` only
   - Redirect unauthenticated users to `/login`.

## Acceptance Criteria
- [ ] Running `npm run build` succeeds without TypeScript errors.
- [ ] Users with role `member` attempting to access `/admin` or `/workspace` are redirected to `/portal`.
- [ ] Database test: A user in SACCO A querying `accounts` cannot see rows belonging to SACCO B.
```

---

### `stages/02-super-admin-sacco-onboarding.md`

```markdown
# Stage 02: Platform Super Admin & SACCO Provisioning

## Objective
Build the Platform Super Admin cockpit (`/admin`) for the SaaS owner to monitor platform revenue, track tenant health, and onboard new SACCOs with zero-friction payment setup.

## Tasks for Agent
1. **Admin Layout (`app/(platform-admin)/admin/layout.tsx`):**
   - Header with Super Admin profile badge, platform status indicator, and dark green branding.
   - Sidebar: Dashboard, SACCO Management, Subscriptions & Billing, Tenant Management, System Health.
2. **Admin Overview Screen (`app/(platform-admin)/admin/page.tsx`):**
   - Metrics cards: Total SACCOs, Total Members across platform, Monthly Revenue (UGX), Active Subscriptions.
   - Growth chart component showing SACCO vs. Member growth.
   - Subscription plans breakdown donut chart (Monthly, Annual, Trial).
   - System health status cards (Application, Supabase DB, Payment Gateway, Email).
3. **"Onboard New SACCO" Modal & Workflow:**
   - Form inputs: SACCO Name, Registration Number, Settlement Bank (Stanbic, Centenary, DFCU, etc.), Bank Account Number, Bank Account Name, Admin Full Name, Admin Phone.
   - Server Action `onboardSacco`:
     - Creates tenant row in `saccos`.
     - Generates dedicated mock/real `iotec_wallet_id`.
     - Creates initial admin profile in `profiles` with role `sacco_admin`.
     - Seeds default SACCO general ledger chart of accounts.

## Acceptance Criteria
- [ ] Creating a new SACCO outputs a record in `saccos` with an assigned `iotec_wallet_id`.
- [ ] Metrics cards accurately aggregate counts across all active tenants.
- [ ] Unauthenticated users or non-super-admins cannot load `/admin`.
```

---

### `stages/03-bulk-onboarding-zero-cost-activation.md`

```markdown
# Stage 03: Bulk Member Onboarding & Zero-Cost Activation Engine

## Objective
Allow newly onboarded SACCO admins to import hundreds of members via CSV/Excel, and enable members to activate their accounts without consuming paid SMS credits.

## Dependencies
- `papaparse` (CSV parsing) or `xlsx` (Excel parsing)
- `jspdf` or `@react-pdf/renderer` (Printable branch slips)

## Tasks for Agent
1. **CSV/Excel Upload Interface (`app/(sacco-staff)/workspace/members/import/page.tsx`):**
   - Drag-and-drop zone with a downloadable CSV template (`Full Name, Phone Number, NIN, Opening Savings Balance, Opening Share Capital`).
   - Pre-flight dry-run validator: Highlights rows with duplicate NINs, invalid Ugandan phone prefixes (`07...` or `2567...`), or malformed amounts.
2. **Batch Import Server Action:**
   - Ingests validated rows inside an atomic database transaction:
     - Creates `profiles` (sets `is_activated = false`, generates unique `activation_token`).
     - Creates `accounts` for Savings and Share Capital with opening balances.
3. **Zero-Cost Activation Channels:**
   - **Channel A: WhatsApp Deep-Link Generator:**
     - Next to each member row, add a button that opens `https://wa.me/{phone}?text={encodedMessage}` with a pre-filled activation URL.
   - **Channel B: Printable Branch Slips (PDF):**
     - Button: "Download Activation Slips (PDF)".
     - Generates 8 printable slips per A4 page containing Member Name, Member Number, and Temporary PIN.
   - **Channel C: Self-Service "Claim Account" Portal (`app/(auth)/claim-account/page.tsx`):**
     - Inputs: Phone Number + National ID (NIN).
     - Query matches inactive profile within the SACCO; on match, allows setting a 4-digit PIN/password directly. **Zero SMS sent.**

## Acceptance Criteria
- [ ] Uploading a CSV with 50 valid members inserts all profiles and accounts in < 3 seconds.
- [ ] Clicking "WhatsApp Invite" opens a valid WhatsApp link with the member's unique activation token.
- [ ] Member can claim account on `/claim-account` using Phone + NIN and immediately log in.
```

---

### `stages/04-staff-workspace-operations.md`

```markdown
# Stage 04: SACCO Staff Workspace (Branch Operations)

## Objective
Build the day-to-day branch dashboard for SACCO Managers, Loan Officers, and Cashiers to manage members, review KYC documents, and approve credit.

## Tasks for Agent
1. **Workspace Layout (`app/(sacco-staff)/workspace/layout.tsx`):**
   - Header with SACCO name (e.g., "Kampala SACCO"), Manager avatar (Grace N. Muwanga), date display, search bar, and NotificationBell.
   - Sidebar: Dashboard, Members, KYC Management, Savings & Shares, Loans, Accounting & Ledger, Reports.
2. **Branch Overview Dashboard (`app/(sacco-staff)/workspace/page.tsx`):**
   - Metric cards: Total Members, Total Savings (UGX), Total Shares (UGX), Total Loan Portfolio (UGX).
   - Financial Overview line graph (Savings vs. Shares vs. Loans).
   - Member Distribution donut chart (Active, On Hold, Dormant).
   - Quick Action buttons: Register Member, Process Loan, Record Deposit, Generate Report.
   - **Pending Approvals Queue Widget:** Real-time list of loans needing approval, new KYC submissions, and flagged transactions.
3. **KYC Review Panel (`app/(sacco-staff)/workspace/kyc/page.tsx`):**
   - Document modal viewing National ID front/back and passport photos.
   - Actions: `Approve KYC` or `Reject with Reason`. Updates `profiles.kyc_status`.
4. **Loan Appraisal & Approval Workflow (`app/(sacco-staff)/workspace/loans/page.tsx`):**
   - Pipeline view: `Pending` -> `Under Review` -> `Approved` -> `Disbursed`.
   - Appraisal dialog calculating debt-to-savings ratio before manager signs off.

## Acceptance Criteria
- [ ] Metrics display values strictly filtered by the logged-in staff member's `sacco_id`.
- [ ] Approving a loan transitions status to `approved` and sends an internal notification to the member.
- [ ] KYC document approval immediately updates member status in the database.
```

---

### `stages/05-member-portal-pwa.md`

```markdown
# Stage 05: Member Portal (PWA & Self-Service)

## Objective
Build the mobile-first self-service portal (`/portal`) for SACCO members to track balances, apply for loans, and access cooperative services, configured as an installable Progressive Web App (PWA).

## Tasks for Agent
1. **PWA Configuration:**
   - Configure `public/manifest.json` with FlexSACCO branding, Ugandan cooperative icons, and standalone display mode.
   - Add service worker caching for offline balance display.
   - Add in-app "Install App" button in the header.
2. **Member Dashboard (`app/(member-portal)/portal/page.tsx`):**
   - Greeting banner with Member Name (e.g., John Muganzi) and Member ID.
   - Balance cards: Savings Balance, Share Capital, Loan Balance, Total Balance donut chart.
   - KYC Verification Progress tracker (National ID, Passport Photo, Proof of Residence status).
   - Active Loan Card: Displays principal, remaining balance, and repayment progress bar (e.g., "8 of 12 payments").
   - Quick Action buttons: Apply for Loan, Make a Deposit, Buy Shares, Update KYC.
3. **Loan Application Modal:**
   - Product selector (Agricultural Loan, School Fees Loan, Emergency Loan).
   - Amount slider with automatic monthly repayment calculation.
4. **Transaction History List:**
   - Paginated history with status pills (`Completed`, `Pending`) and UGX formatting.

## Acceptance Criteria
- [ ] Member portal renders responsively on mobile screen sizes (360px to 428px width).
- [ ] PWA install banner displays correctly on compatible Android/iOS browsers.
- [ ] Member can view only their own balances and transactions (guaranteed by RLS).
```

---

### `stages/06-iotec-pay-payments-ledger.md`

```markdown
# Stage 06: ioTec Pay Payment Engine & Non-Interfering Ledger

## Objective
Integrate the official ioTec Pay v1 API for MTN MoMo and Airtel Money collections and disbursements, enforcing absolute financial isolation between SACCO tenants.

## Tasks for Agent
1. **ioTec Client (`lib/iotec/client.ts`):**
   - Implement OAuth 2.0 Client Credentials flow caching tokens from `https://id.iotec.io/connect/token`.
   - Method `initiateCollection`: Calls `POST https://pay.iotec.io/api/collections/mobile-money`.
   - Method `initiateDisbursement`: Calls `POST https://pay.iotec.io/api/disbursements/disburse`.
2. **Member Deposit Action (`lib/actions/payments.ts`):**
   - Generates unique idempotent `externalId`: `TXN_{sacco_id}_{uuid}`.
   - Injects the member's SACCO `iotec_wallet_id`.
   - Calls `initiateCollection` with member's MSISDN (`256XXXXXXXXX`).
   - Creates a `pending` row in `transactions`.
3. **Secure Webhook Handler (`app/api/webhooks/iotec/route.ts`):**
   - Validates `X-Webhook-Secret` header from request.
   - Reads `externalId`, `walletId`, and `status`.
   - **Cross-Tenant Firewall Check:**
     - Asserts `payload.walletId === sacco.iotec_wallet_id`.
     - Aborts and logs security alert if wallet does not match the transaction's SACCO.
   - **Atomic Balance Update:**
     - Calls database stored procedure to credit `accounts.balance` and mark `transactions.status = 'completed'`.
4. **SACCO Bank Liquidation Flow:**
   - Staff action: "Liquidate to Bank".
   - Initiates bank payout to the SACCO's verified bank account on file via ioTec Pay.

## Acceptance Criteria
- [ ] Payment request accurately passes tenant-specific `walletId` to ioTec Pay.
- [ ] Webhook rejects any payload where the `walletId` does not match the transaction's `sacco_id`.
- [ ] Successful callback updates member account balance and creates a transaction record atomically.
```

---

### `stages/07-notifications-sms-adapter.md`

```markdown
# Stage 07: In-App Real-Time Notifications & Future-Proof SMS Adapter

## Objective
Implement zero-cost real-time in-app alerts via Supabase Realtime and establish a plug-and-play SMS interface ready for direct telecom gateway activation in years 2–4.

## Tasks for Agent
1. **Notification Bell Component (`components/shared/NotificationBell.tsx`):**
   - Dropdown menu showing unread notifications with timestamps and clickable action URLs.
   - Supabase Realtime channel subscription listening to `INSERT` on `notifications` table where `user_id = auth.uid()`.
   - Live badge counter incrementation without page refresh.
2. **Notification Dispatch Service (`lib/services/notification-service.ts`):**
   - Function `notifyUser({ saccoId, userId, title, message, type, actionUrl })`.
   - Automatically inserts to `notifications` table.
   - Triggers Web Push notification if user has registered a service worker push subscription.
3. **Pluggable SMS Adapter Pattern (`lib/notifications/sms-provider.ts`):**
   - Define TypeScript interface:
     ```typescript
     export interface SmsProvider {
       sendSms(phoneNumber: string, message: string): Promise<boolean>;
     }
     ```
   - Implement `NoopSmsProvider`: Logs message to internal debug audit table or console. **Active default (Years 0-2).**
   - Implement `AfricasTalkingSmsProvider`: Pre-built integration ready for API keys.
   - Factory pattern: Reads `process.env.SMS_PROVIDER` (defaults to `'noop'`).

## Acceptance Criteria
- [ ] Triggering a deposit immediately increments the member's bell notification badge in real time.
- [ ] No outbound paid SMS HTTP calls are executed when running under default configuration.
- [ ] Changing `SMS_PROVIDER="africastalking"` in `.env` activates the real SMS provider without modifying UI or business logic code.
```

---

