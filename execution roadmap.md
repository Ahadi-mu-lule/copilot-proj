Here is your complete, end-to-end **A-to-Z Execution Roadmap** for building and launching **FlexSACCO Uganda**. Follow these sequential steps from purchasing your domain to running your live pilot with real SACCOs.

---

```
                       [ THE A-TO-Z ROADMAP OVERVIEW ]

   PHASE A: Infrastructure & Accounts (Domain, Cloudflare, Supabase, ioTec)
                             │
                             ▼
   PHASE B: Project Scaffolding & Antigravity Setup
                             │
                             ▼
   PHASE C: Database Schema, Multi-Tenancy & RLS Initialization
                             │
                             ▼
   PHASE D: Running the 7 Antigravity Stages (Building the Codebase)
                             │
                             ▼
   PHASE E: Deployment, Domain Routing & ioTec Live Verification
                             │
                             ▼
   PHASE F: Onboarding Your First Live Pilot SACCO in Uganda
```

---

## Phase A: Infrastructure & Accounts Setup (Day 1)

### Step 1: Acquire Your Ugandan Domain
1. Visit an accredited registrar (e.g., [EACdirectory](https://www.eacdirectory.com), [Web4Africa](https://web4africa.com), or Portbell).
2. Purchase your primary domain:
   * **`flexsacco.ug`** (~$35/year) or **`flexsacco.co.ug`** (~$15/year).
3. Do not buy hosting or email packages from the registrar; you only need the domain name.

### Step 2: Set Up Cloudflare (DNS, Edge & Wildcard SSL)
1. Create a free account at [Cloudflare](https://www.cloudflare.com).
2. Add your domain (`flexsacco.ug`). Cloudflare will assign two nameservers (e.g., `ada.ns.cloudflare.com`).
3. Log in to your domain registrar dashboard and replace their default nameservers with Cloudflare's.
4. Under **SSL/TLS** in Cloudflare:
   * Set encryption mode to **Full (Strict)**.
   * Enable **Always Use HTTPS**.

### Step 3: Provision Supabase Managed Cloud
1. Go to [Supabase](https://supabase.com) and create a new project named `flexsacco-prod`.
2. **Region Selection:** Choose **South Africa (Cape Town - `af-south-1`)** or **Europe (Frankfurt - `eu-central-1`)** for lowest latency to Ugandan mobile networks.
3. Save your generated database password and copy your project keys from **Settings > API**:
   * Project URL (`https://xyz.supabase.co`)
   * `anon` public key
   * `service_role` secret key

### Step 4: Register with ioTec Pay (Uganda)
1. Register your master merchant account with ioTec (`pay.iotec.io` and `id.iotec.io`).
2. Complete KYC/business verification with your Ugandan registered entity documents (Certificate of Incorporation, Tax Identification Number / URA TIN).
3. Obtain your developer API credentials:
   * `IOTEC_CLIENT_ID`
   * `IOTEC_CLIENT_SECRET`
   * Set your Webhook Secret header string (`IOTEC_WEBHOOK_SECRET`).

---

## Phase B: Project Scaffolding & Antigravity Setup (Day 2)

### Step 5: Initialize Next.js Project Locally
Open your terminal and run:
```bash
npx create-next-app@latest flexsacco --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd flexsacco
```

Install core dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge tailwindcss-animate
npm install papaparse jspdf recharts
npm install -D @types/papaparse
```

Install shadcn/ui primitives:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog dropdown-menu input table badge tabs
```

### Step 6: Configure Environment Variables
Create `.env.local` in the project root:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ioTec Pay Uganda
IOTEC_CLIENT_ID=your-iotec-client-id
IOTEC_CLIENT_SECRET=your-iotec-client-secret
IOTEC_WEBHOOK_SECRET=your-chosen-secret-string

# App Settings
NEXT_PUBLIC_APP_DOMAIN=flexsacco.ug
SMS_PROVIDER=noop
```

### Step 7: Place Antigravity Guidance Files
1. Place the master specification file `PROJECT_SPEC.md` in the project root.
2. Run the stage generation script created earlier to populate the `stages/` folder with files `01` through `07`.
3. Update `tailwind.config.ts` with the green brand tokens (`#063A2F`, `#0D7A5F`) so all generated UI adheres to the design.

---

## Phase C: Database Schema & Multi-Tenancy Initialization (Day 3)

### Step 8: Apply PostgreSQL Schema
1. Open your Supabase Dashboard and navigate to the **SQL Editor**.
2. Paste and run the entire `supabase/migrations/001_initial_schema.sql` migration.
3. This creates:
   * Core tables (`saccos`, `profiles`, `accounts`, `loans`, `transactions`, `notifications`).
   * Row-Level Security (RLS) policies enforcing multi-tenancy.
   * Composite foreign keys `(sacco_id, account_id)` blocking cross-tenant writes.
   * Secure `complete_deposit_transaction` database stored procedure.

### Step 9: Seed Initial Admin & Demo Tenants
In the SQL Editor, execute seed records:
```sql
-- Create Platform Super Admin Profile
INSERT INTO saccos (id, name, slug, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000000', 'FlexSACCO Platform HQ', 'hq', 'active');

-- Create Pilot Demo Tenant: Kampala SACCO
INSERT INTO saccos (name, slug, registration_number, iotec_wallet_id, bank_name, bank_account_number, bank_account_name, subscription_status)
VALUES (
    'Kampala SACCO',
    'kampala',
    'UMRA/2026/KLA-001',
    gen_random_uuid(),
    'Stanbic Bank Uganda',
    '903000881920',
    'Kampala SACCO Ltd',
    'active'
);
```

---

## Phase D: Running Antigravity Agents by Stages (Days 4–10)

Instruct your Antigravity agent to work sequentially through the `stages/` folder. **Do not begin a new stage until the current stage's 5 checks pass.**

### Step 10: Run Stage 01 — Foundation, Auth & Middleware
* **Prompt to Agent:** *"Read `stages/01-foundation-database-auth.md`. Build the Supabase Auth handlers, Next.js role-based routing middleware, and test that members cannot access `/admin` or `/workspace`."*
* **Verification:** Run `npm run build` and test routing guards.

### Step 11: Run Stage 02 — Super Admin Cockpit & Direct Exports
* **Prompt to Agent:** *"Read `stages/02-super-admin-sacco-onboarding.md`. Implement `/admin` matching Image 5, the SACCO onboarding modal that provisions dedicated ioTec wallet IDs, and the direct CSV export endpoint `/api/admin/export/saccos`."*
* **Verification:** Test onboarding a mock SACCO and verify the CSV download button triggers an immediate download.

### Step 12: Run Stage 03 — Bulk Member Import & Zero-Cost Activation
* **Prompt to Agent:** *"Read `stages/03-bulk-onboarding-zero-cost-activation.md`. Build the CSV parser, dry-run validation table, WhatsApp `wa.me` deep-link generator, printable branch slips generator, and the public `/claim-account` portal (matching NIN + Phone at zero SMS cost)."*
* **Verification:** Upload a 10-member sample CSV and activate an account via `/claim-account`.

### Step 13: Run Stage 04 — Staff Workspace & Loan Pipeline
* **Prompt to Agent:** *"Read `stages/04-staff-workspace-operations.md`. Build the Kampala SACCO staff workspace matching Image 1 (KPI cards, Member & Loan donut, Recent Transactions table, KYC review desk, and loan appraisal engine with direct CSV/PDF download buttons)."*
* **Verification:** Submit and approve a loan application; verify that the debt-to-savings ratio check flags over-leveraged borrowers.

### Step 14: Run Stage 05 — Member Portal (PWA & Self-Service)
* **Prompt to Agent:** *"Read `stages/05-member-portal-pwa.md`. Build the Member Portal matching Image 4 (John Muganzi view with Savings/Shares donut, 8 of 12 payments loan tracker, KYC checklist, manifest.json PWA configuration, and direct PDF statement downloads)."*
* **Verification:** Open on a mobile device or responsive simulator; ensure the PWA install prompt triggers and the UI scales properly on a 360px width.

### Step 15: Run Stage 06 — ioTec Pay Engine & Non-Interfering Ledger
* **Prompt to Agent:** *"Read `stages/06-iotec-pay-payments-ledger.md`. Implement `lib/iotec/client.ts` with OAuth token caching (`id.iotec.io`), MoMo collection endpoints (`pay.iotec.io`), and the secure webhook receiver `/api/webhooks/iotec` enforcing the tenant wallet firewall."*
* **Verification:** Send a simulated webhook callback; verify that mismatched `walletId` requests return HTTP 403 and leave account balances untouched.

### Step 16: Run Stage 07 — In-App Realtime Alerts & Production Hardening
* **Prompt to Agent:** *"Read `stages/07-notifications-sms-adapter.md`. Implement the `NotificationBell.tsx` component with Supabase Realtime WebSocket subscriptions, configure the `NoopSmsProvider` adapter, and run the Stage 7 Verification Suite."*
* **Verification:** Complete the End-to-End System Smoke Test across all roles.

---

## Phase E: Deployment, Domain Routing & Go-Live (Days 11–12)

### Step 17: Deploy to Vercel
1. Push your finalized codebase to a private GitHub repository.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project > Import Git Repository**.
3. In Project Settings, add all variables from your `.env.local` file under **Environment Variables**.
4. Click **Deploy**.

### Step 18: Connect Domain & Configure Wildcard Routing
1. In your Vercel Project Dashboard, navigate to **Settings > Domains**.
2. Add your primary domain:
   * `flexsacco.ug`
3. Add the wildcard domain:
   * `*.flexsacco.ug`
4. In your Cloudflare Dashboard, add the required CNAME records:
   * **Root Record:** Type `CNAME` | Name `@` | Target `cname.vercel-dns.com` | Proxy: `Proxied`
   * **Wildcard Record:** Type `CNAME` | Name `*` | Target `cname.vercel-dns.com` | Proxy: `Proxied`
5. Vercel and Cloudflare will automatically generate and renew SSL certificates for every subdomain.

### Step 19: Register Live Webhook with ioTec Pay
1. In your ioTec Pay merchant dashboard, locate **Callbacks / Webhooks**.
2. Set the Webhook URL to your live domain:
   ```text
   https://flexsacco.ug/api/webhooks/iotec
   ```
3. Add your custom secret header key:
   * Header Name: `X-Webhook-Secret`
   * Header Value: *(Matches your `IOTEC_WEBHOOK_SECRET` environment variable)*

---

## Phase F: Onboarding Your First Pilot SACCO (Days 13–14)

```
                       [ PILOT ONBOARDING WORKFLOW ]

  1. Log in to `admin.flexsacco.ug` as Super Admin
  2. Click "Onboard New SACCO" -> Input Kampala SACCO + Stanbic Bank details
  3. System provisions dedicated ioTec sub-wallet automatically
  4. Hand over login credentials to Kampala SACCO Manager (Grace N. Muwanga)
  5. Manager logs into `kampala.flexsacco.ug`
  6. Bulk-uploads legacy member Excel sheet
  7. Staff clicks "Send WhatsApp Invite" or members claim accounts via Phone + NIN
  8. Members log into Member Portal (or install PWA on Android)
  9. Member deposits UGX 5,000 via MTN MoMo / Airtel Money to test the live rail
 10. Funds settle into Kampala SACCO's dedicated wallet with zero leaks!
```

---

### Ready to Execute

You have the complete blueprint: architecture, zero-cost launch strategy, security firewalls, official ioTec Pay specs, and the 7 Antigravity execution stages.

Open your Antigravity IDE, create your project directory, add `PROJECT_SPEC.md`, and prompt your agent to execute **Stage 01** to begin development.