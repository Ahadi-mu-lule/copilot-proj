Here is the complete, production-ready technical blueprint. You can drop these files directly into your project root so that Google Antigravity can scaffold and build the entire codebase without guesswork.

---

### File 1: `PROJECT_SPEC.md`
*Place this file in the root of your project. It acts as the master instruction guide for Antigravity agents.*

```markdown
# FlexSACCO Uganda - System Specification & Agent Instructions

## 1. Project Overview & Business Model
FlexSACCO Uganda is a B2B multi-tenant SaaS cooperative banking platform designed for SACCOs across Uganda.
- Platform Provider: FlexSACCO (Super Admin collects SaaS subscription fees into platform bank account).
- Tenants: Independent SACCOs (e.g., Kampala SACCO, Luwero SACCO). Each has its own isolated funds, members, and dedicated ioTec Pay virtual wallet.
- Member Access: Self-service Progressive Web App (PWA) with zero SMS costs (activations via WhatsApp deep-links, NIN-phone self-claiming, printable branch slips, and in-app Supabase Realtime alerts).

## 2. Technology Stack & Directory Structure
- Framework: Next.js (App Router, TypeScript)
- UI Library: Tailwind CSS, shadcn/ui, Lucide Icons
- Database & Auth: Supabase (PostgreSQL with Row Level Security, Supabase Auth, Supabase Storage)
- Realtime: Supabase Realtime WebSockets (in-app notifications)
- Payments Engine: ioTec Pay API (OAuth 2.0 at `id.iotec.io`, Collections/Disbursements at `pay.iotec.io`)
- Currency: UGX (Ugandan Shilling)

### Directory Layout
```text
flexsacco/
├── app/
│   ├── (auth)/                  # Login, Account Claiming, PIN Setup
│   ├── (platform-admin)/        # /admin - SaaS Super Admin Dashboard & Tenant Billing
│   ├── (sacco-staff)/           # /workspace - Manager, Loans, KYC, General Ledger
│   ├── (member-portal)/         # /portal - PWA Member Self-Service (Savings, Loans, MoMo)
│   ├── api/
│   │   ├── webhooks/iotec/      # ioTec Pay Webhook receiver with security header verification
│   │   └── export/              # PDF generation (printable branch activation slips)
├── components/
│   ├── ui/                      # shadcn UI components
│   ├── shared/                  # UgxDisplay, StatusPill, KycPreview, NotificationBell
│   └── layouts/                 # Sidebars, Headers, Mobile bottom navigation
├── lib/
│   ├── supabase/                # client.ts, server.ts, middleware.ts
│   ├── iotec/                   # client.ts, token-cache.ts, types.ts
│   ├── notifications/           # sms-provider.ts (Adapter pattern with Noop today)
│   └── utils/                   # loan-calculator.ts, currency.ts
├── supabase/
│   └── migrations/              # SQL schema, RLS policies, trigger functions
└── PROJECT_SPEC.md
```

## 3. Strict Non-Negotiable Rules for lovable Agents
1. **Multi-Tenant Isolation:** Every tenant-specific table MUST contain a `sacco_id UUID REFERENCES saccos(id)`. Direct data reads/writes must be guarded by Supabase RLS policies.
2. **Zero Cross-Tenant Payment Leaks:** All payment calls to ioTec Pay must inject the SACCO's specific `iotec_wallet_id`. Webhooks must verify `payload.walletId === sacco.iotec_wallet_id`.
3. **Zero-Cost SMS Mode:** Do NOT call paid SMS gateways. Use the `NoopSmsProvider` interface. Members activate via WhatsApp deep-linking (`wa.me`), in-branch printable slips, or NIN+Phone claiming.
4. **Double-Entry Ledger:** Every approved transaction must create balancing Debit and Credit rows in `journal_entries` tagged with the identical `sacco_id`.
```

---

### File 2: `supabase/migrations/001_initial_schema.sql`
*Run this in your Supabase SQL Editor or apply via Supabase CLI.*

```sql
-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('super_admin', 'sacco_admin', 'sacco_staff', 'member');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'overdue', 'suspended');
CREATE TYPE account_type AS ENUM ('savings', 'share_capital');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'loan_repayment', 'share_purchase');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE loan_status AS ENUM ('pending', 'under_review', 'approved', 'disbursed', 'rejected', 'closed');

-- 3. SAAS TENANTS (SACCOS)
CREATE TABLE saccos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    registration_number VARCHAR(100),
    iotec_wallet_id UUID UNIQUE, -- Dedicated ioTec Pay sub-wallet
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(100),
    bank_account_name VARCHAR(255),
    subscription_status subscription_status DEFAULT 'trial',
    subscription_renews_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sacco_id UUID REFERENCES saccos(id) ON DELETE CASCADE,
    role user_role DEFAULT 'member',
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL, -- e.g. 2567XXXXXXXX
    national_id_nin VARCHAR(30),
    member_number VARCHAR(50),         -- e.g. M-00124
    is_activated BOOLEAN DEFAULT FALSE,
    activation_token VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (sacco_id, phone_number),
    UNIQUE (sacco_id, national_id_nin)
);

-- 5. ACCOUNTS (SAVINGS & SHARES)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_type account_type NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'UGX',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (sacco_id, account_number),
    UNIQUE (sacco_id, id) -- For composite foreign keys
);

-- 6. LOANS
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    loan_product_name VARCHAR(100) NOT NULL,
    principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
    interest_rate_percent NUMERIC(5, 2) NOT NULL,
    repayment_months INT NOT NULL,
    balance_outstanding NUMERIC(15, 2) NOT NULL,
    status loan_status DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    disbursed_at TIMESTAMPTZ,
    next_payment_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
    account_id UUID NOT NULL,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 500), -- ioTec min amount is 500 UGX
    currency VARCHAR(3) DEFAULT 'UGX',
    external_reference VARCHAR(150) UNIQUE NOT NULL,       -- TXN_{sacco_id}_{uuid}
    iotec_transaction_id VARCHAR(150),
    payment_method VARCHAR(50) DEFAULT 'momo',             -- 'momo_mtn', 'momo_airtel', 'bank'
    status transaction_status DEFAULT 'pending',
    phone_payer VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_transaction_account 
        FOREIGN KEY (sacco_id, account_id) 
        REFERENCES accounts(sacco_id, id)
);

-- 8. REAL-TIME IN-APP NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sacco_id UUID NOT NULL REFERENCES saccos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    action_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE saccos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Get authenticated user's SACCO ID
CREATE OR REPLACE FUNCTION get_auth_sacco_id()
RETURNS UUID AS $$
    SELECT sacco_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Policies for Member Accounts: Users only view their own accounts inside their own SACCO
CREATE POLICY "Members view own accounts" ON accounts
    FOR SELECT USING (sacco_id = get_auth_sacco_id() AND member_id = auth.uid());

-- Staff can view all accounts belonging to their specific SACCO
CREATE POLICY "Staff view SACCO accounts" ON accounts
    FOR ALL USING (
        sacco_id = get_auth_sacco_id() AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('sacco_admin', 'sacco_staff')
        )
    );

-- Notifications: Users only see their own notifications
CREATE POLICY "Users read own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());
```

---

### File 3: `lib/iotec/client.ts`
*Type-safe implementation targeting the official ioTec Pay v1 and Identity APIs.*

```typescript
// lib/iotec/client.ts

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface CollectionRequest {
  walletId: string;
  payer: string; // 256XXXXXXXXX
  amount: number;
  currency: 'UGX';
  externalId: string;
  payerMessage?: string;
  payeeMessage?: string;
}

interface CollectionResponse {
  requestId: string;
  status: 'SentToVendor' | 'Pending' | 'Success' | 'Failed';
  message?: string;
}

class IoTecPayClient {
  private clientId: string;
  private clientSecret: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.IOTEC_CLIENT_ID || '';
    this.clientSecret = process.env.IOTEC_CLIENT_SECRET || '';
  }

  /**
   * OAuth 2.0 Client Credentials token fetcher with in-memory caching
   */
  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedToken && this.tokenExpiry > now + 60) {
      return this.cachedToken;
    }

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('grant_type', 'client_credentials');

    const res = await fetch('https://id.iotec.io/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      throw new Error(`ioTec Auth failed: ${res.statusText}`);
    }

    const data: TokenResponse = await res.json();
    this.cachedToken = data.access_token;
    this.tokenExpiry = now + data.expires_in;
    return this.cachedToken;
  }

  /**
   * Triggers an MTN / Airtel Mobile Money USSD prompt on member's handset
   */
  public async initiateCollection(payload: CollectionRequest): Promise<CollectionResponse> {
    const token = await this.getAccessToken();

    const res = await fetch('https://pay.iotec.io/api/collections/mobile-money', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`ioTec Collection error (${res.status}): ${errorText}`);
    }

    return await res.json();
  }
}

export const ioTecPay = new IoTecPayClient();
```

---

### File 4: `app/api/webhooks/iotec/route.ts`
*Secure Webhook Handler that isolates tenant payments and triggers real-time in-app alerts.*

```typescript
// app/api/webhooks/iotec/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Internal admin client with Service Role to bypass RLS for ledger writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret Header configured in ioTec Dashboard
    const secretHeader = req.headers.get('X-Webhook-Secret');
    if (secretHeader !== process.env.IOTEC_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
    }

    const body = await req.json();
    const { id, externalId, walletId, amount, status } = body;

    if (status !== 'Success') {
      // Mark transaction as failed
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('external_reference', externalId);
      return NextResponse.json({ message: 'Marked failed' }, { status: 200 });
    }

    // 2. Fetch the transaction and verify wallet ownership
    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('*, saccos(iotec_wallet_id)')
      .eq('external_reference', externalId)
      .single();

    if (txnError || !txn) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 3. ZERO CROSS-TENANT INTERFERENCE CHECK
    if (txn.saccos?.iotec_wallet_id !== walletId) {
      console.error(`SECURITY ALERT: Wallet mismatch for transaction ${externalId}`);
      return NextResponse.json({ error: 'Tenant wallet mismatch' }, { status: 403 });
    }

    // 4. Atomic Balance Update
    await supabaseAdmin.rpc('complete_deposit_transaction', {
      p_transaction_id: txn.id,
      p_account_id: txn.account_id,
      p_amount: amount,
      p_iotec_id: id,
    });

    // 5. Send Realtime In-App Notification (Zero Cost)
    await supabaseAdmin.from('notifications').insert([
      {
        sacco_id: txn.sacco_id,
        user_id: txn.member_id,
        title: 'Deposit Received',
        message: `UGX ${Number(amount).toLocaleString()} has been credited to your account.`,
        type: 'payment',
        action_url: '/portal',
      },
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### Antigravity Launch Command

You can now start Antigravity and prompt your agent:

> *"Read `PROJECT_SPEC.md` and review the database schema in `supabase/migrations/001_initial_schema.sql`. Implement Phase 1: set up Supabase Auth with role-based routing middleware, and create the SACCO Admin bulk member upload view with the WhatsApp deep-link (`wa.me`) activation generator."*