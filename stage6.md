Here is the complete **`stages/06-iotec-pay-payments-ledger.md`** file, providing the ioTec Pay v1 payment engine, multi-tenant financial firewalls, double-entry ledger hooks, direct download reconciliation tools, and the stage verification checks suite.

---

```markdown
# Stage 06: ioTec Pay Payment Engine & Non-Interfering Ledger

## 1. Objective
Integrate the official **ioTec Pay v1 API** (`pay.iotec.io` and `id.iotec.io`) for automated Mobile Money collections (MTN MoMo and Airtel Money Uganda), disbursements, and commercial bank liquidations. Enforce the **Zero Cross-Tenant Payment Interference** rule at the code, API, and database levels, complete with **direct-download reconciliation engines** and **mandatory stage checks**.

---

## 2. Payment Architecture & Anti-Interference Firewalls

The agent must enforce the 4-tier firewall to ensure no SACCO's money or transaction data ever mixes with another:

```
[ MEMBER: MoMo Push Request ]
             │
             ▼
[ FlexSACCO Backend ] ──► Injects Tenant's Dedicated `sacco.iotec_wallet_id`
             │
             ▼
[ ioTec Pay API ] ────► Routes funds directly to that SACCO's isolated sub-wallet
             │
             ▼
[ Webhook Callback ] ──► Asserts `payload.walletId === sacco.iotec_wallet_id`
                         (Rejects and flags if there is any mismatch)
             │
             ▼
[ Atomic DB Ledger ] ──► Updates balance only where `sacco_id` matches
```

---

## 3. Direct Download Engines for Stage 6

Staff and administrators must be able to export audit records and reconciliation reports directly:

### A. Endpoint: `GET /api/workspace/export/reconciliation`
- **File Output:** `Kampala_SACCO_Payment_Reconciliation_YYYY-MM-DD.csv`
- **Headers Sent:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="Kampala_SACCO_Payment_Reconciliation_2026-11-01.csv"`
- **Columns Included:** `Internal Reference (TXN_...)`, `ioTec Request ID`, `Member Name`, `Phone`, `Amount (UGX)`, `Channel (MTN/Airtel)`, `ioTec Wallet ID`, `Initiated At`, `Completed At`, `Status`.

### B. Endpoint: `GET /api/workspace/export/bank-settlements`
- **File Output:** `Kampala_SACCO_Bank_Liquidations_YYYY-MM-DD.csv`
- **Columns Included:** `Settlement ID`, `Amount Liquidated (UGX)`, `Destination Bank`, `Account Number`, `Account Name`, `Status`, `Initiated By`, `Timestamp`.

---

## 4. Step-by-Step Implementation Tasks

### Task 4.1: ioTec OAuth 2.0 Client & Token Cache (`lib/iotec/client.ts`)
- Target identity endpoint: `https://id.iotec.io/connect/token`.
- Enforce token caching: Re-use cached JWT token in memory for its 300-second lifespan (`expires_in: 300`) rather than requesting a new token for each transaction.
- Methods to implement:
  - `initiateCollection(params)`: `POST https://pay.iotec.io/api/collections/mobile-money`
  - `initiateDisbursement(params)`: `POST https://pay.iotec.io/api/disbursements/disburse`
  - `checkStatus(requestId)`: `GET https://pay.iotec.io/api/collections/status/{requestId}`

### Task 4.2: Payment Initiation Server Action (`lib/actions/payments.ts`)
Implement `initiateMemberDepositAction({ accountId, amount, phone })`:
1. Validate `amount >= 500` (ioTec Pay minimum transaction limit is 500 UGX).
2. Format phone to standard MSISDN `256XXXXXXXXX`.
3. Fetch calling member's `sacco_id` and query `saccos.iotec_wallet_id`.
4. Generate strictly formatted idempotent external reference:
   ```typescript
   const externalId = `TXN_${sacco.slug.toUpperCase()}_${crypto.randomUUID()}`;
   ```
5. Insert a row in `transactions` with `status = 'pending'`.
6. Call `ioTecPay.initiateCollection(...)` with the SACCO's dedicated `walletId`.
7. Return `{ success: true, externalId }` so the UI can display a *"Check your phone for the PIN prompt"* dialog.

### Task 4.3: Secure Webhook Receiver (`app/api/webhooks/iotec/route.ts`)
Handle incoming callbacks from ioTec Pay:
1. **Secret Header Check:** Validate `req.headers.get('X-Webhook-Secret') === process.env.IOTEC_WEBHOOK_SECRET`.
2. **Payload Parse:** Extract `externalId`, `walletId`, `amount`, and `status`.
3. **Tenant Firewall Check:**
   - Query transaction by `externalId` and join with `saccos`.
   - **Assert:** `transaction.saccos.iotec_wallet_id === payload.walletId`.
   - If different, respond with HTTP `403 Forbidden` and log a high-severity security alert.
4. **Atomic Balance Execution:**
   - Call PostgreSQL stored function `complete_deposit_transaction`:
     - Updates `transactions.status = 'completed'`.
     - Increments `accounts.balance = accounts.balance + amount`.
     - Creates matching double-entry lines in `journal_entries` within the same `sacco_id`.
5. **Real-time Alert Trigger:**
   - Insert row into `notifications` for the member (`"UGX [amount] deposited successfully"`).

### Task 4.4: SACCO Bank Liquidation Flow (`app/(sacco-staff)/workspace/settings/liquidation/page.tsx`)
- Allows SACCO Managers to sweep funds from their ioTec virtual wallet to their registered commercial bank account (Stanbic, Centenary, etc.).
- Calls `ioTecPay.initiateDisbursement(...)` with `category: "Bank"` locked strictly to `sacco.bank_account_number`.

---

## 5. Mandatory Checks Per Stage (Automated & Manual)

The agent must run and pass all 5 verification checks before declaring Stage 6 complete:

```
+──────────────────────────────────────────────────────────────────────────+
|                          STAGE 06 VERIFICATION SUITE                     |
+──────────────────────────────────────────────────────────────────────────+
| [CHECK 1] ioTec Token Caching & Expiry Lifecycle Check                   |
| [CHECK 2] Multi-Tenant Wallet Firewall Isolation Check                   |
| [CHECK 3] Minimum UGX Amount & Idempotency Check                         |
| [CHECK 4] Atomic Double-Entry Balance Update Check                       |
| [CHECK 5] Direct Reconciliation Export Headers Check                     |
+──────────────────────────────────────────────────────────────────────────+
```

### [CHECK 1] ioTec Token Caching & Expiry Lifecycle Check
* **Objective:** Ensure the application does not exhaust API limits by requesting a token on every call.
* **Test Procedure:**
  1. Trigger 5 consecutive balance check or collection requests.
  2. Inspect outbound calls to `https://id.iotec.io/connect/token`.
* **Assertion:** Exactly 1 call is made to the token URL; subsequent 4 requests reuse the valid in-memory token.

### [CHECK 2] Multi-Tenant Wallet Firewall Isolation Check
* **Objective:** Verify that a webhook attempting to credit SACCO A using SACCO B's wallet ID is physically aborted.
* **Test Procedure:**
  - Send simulated webhook POST with `externalId` belonging to Kampala SACCO, but pass `walletId` belonging to Luwero SACCO.
* **Assertion:**
  - Route returns HTTP `403 Forbidden`.
  - Transaction status remains `pending`.
  - Member account balance does not change.

### [CHECK 3] Minimum UGX Amount & Idempotency Check
* **Objective:** Reject invalid micro-transactions below ioTec minimums and prevent double-charging on network retries.
* **Test Input:**
  - Attempt deposit with `amount = 300` -> Expect: Error `"Minimum deposit is 500 UGX"`.
  - Send two identical webhook calls with the same `externalId`.
* **Assertion:** The second call is acknowledged as already processed without double-crediting the balance.

### [CHECK 4] Atomic Double-Entry Balance Update Check
* **Objective:** Ensure balance updates and ledger entries are atomic (no partial state on network failure).
* **Test Procedure:**
  - Trigger successful webhook for `UGX 100,000`.
* **Assertion:**
  - `accounts.balance` increases by exactly `100,000.00`.
  - `transactions.status` transitions from `pending` to `completed`.
  - Both updates commit in the exact same database transaction timestamp.

### [CHECK 5] Direct Reconciliation Export Headers Check
* **Objective:** Verify reconciliation log exports directly stream CSVs to the browser.
* **Test Command:**
  ```bash
  curl -I -H "Cookie: [STAFF_SESSION_COOKIE]" http://localhost:3000/api/workspace/export/reconciliation
  ```
* **Assertion:**
  - HTTP `200 OK`
  - `Content-Disposition` header contains `attachment; filename="...Reconciliation...csv"`
  - `Content-Type` is `text/csv; charset=utf-8`

---

## 6. Definition of Done
Stage 6 is complete only when:
1. Member deposit triggers prompt an MTN/Airtel PIN request via ioTec Pay.
2. Webhook receiver validates secrets and wallet IDs with zero cross-tenant contamination.
3. Database balances update atomically upon payment confirmation.
4. Direct download buttons for payment reconciliation and liquidation logs function immediately.
5. All 5 Stage Checks pass without regression.
```