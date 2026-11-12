Here is the complete **`stages/05-member-portal-pwa.md`** file, featuring the Progressive Web App (PWA) configuration, member self-service dashboards, direct download statement engines, and the mandatory verification checks suite.

---

```markdown
# Stage 05: Member Portal (PWA & Self-Service)

## 1. Objective
Build the mobile-first self-service Member Portal (`/portal`) matching the John Muganzi wireframe. Members can track their savings and share capital, monitor loan repayment progress, initiate deposits, apply for credit, update KYC documents, and install the application as a **Progressive Web App (PWA)** on Android/iOS, equipped with **direct-download statement engines** and **mandatory stage checks**.

---

## 2. Target UI Layout & Components (Strictly Matching Wireframes)
The Member Portal must replicate the layout in the system designs:
- **Top Navigation Bar:**
  - FlexSACCO Logo with Ugandan theme ("Your Savings. Your Growth. Our Priority.").
  - Global search bar ("Search transactions, loans, or services...").
  - Real-time Notification Bell with unread counter.
  - Member Avatar with Name (`John Muganzi`), Role (`Member`), and Member Number (`Member No: 000123`).
  - **PWA "Install App" Quick Button** (top right).
- **Greeting Banner:**
  - *"Hello, John Muganzi 👋 - Welcome to your SACCO member portal. Manage your accounts, track your transactions and take advantage of our financial services."*
- **KPI Metrics Cards (Top Row):**
  - **Savings Balance:** `UGX 1,250,000` (`↑ 5% this month`)
  - **Share Capital:** `UGX 850,000` (`↑ 3% this month`)
  - **Loan Balance:** `UGX 2,300,000` (`Next payment: 15 Nov`)
  - **Total Accounts:** `4` (`2 Active`, `2 Closed`)
- **Account Overview & KYC Grid (Middle Row):**
  - **Account Overview Card:** Donut chart showing `UGX 2,100,000 Total Balance` split into Savings (`59% - 1,250,000`) and Shares (`41% - 850,000`) with visibility toggle eye icon.
  - **KYC Status Checklist Card:** Verified badge with green checkmarks:
    - National ID (`Verified`)
    - Passport Photo (`Verified`)
    - Proof of Residence (`Verified`)
    - Next Review date tracker.
- **Active Products & Recent Transactions (Lower Grid):**
  - **My Loans Card:**
    - Agricultural Loan (Status: `Active`)
    - Principal: `UGX 2,000,000` | Balance: `UGX 1,850,000` | Next Payment: `15 Nov`
    - Repayment Progress Bar: `8 of 12 payments`
    - Action Buttons: `Make Payment` and `Apply for Another Loan`.
  - **My Savings & Shares Summary Card:**
    - Savings Accounts (`2 accounts - UGX 1,250,000`)
    - Share Capital (`1 account - UGX 850,000`)
  - **Recent Transactions Paginated Table:**
    - Columns: Date, Description, Type, Amount (UGX with `+` or `-`), Status (`Completed`).
    - Entries: Deposit, Loan Repayment, Share Purchase, Withdrawal, Interest Credit.
- **Sidebars & Quick Actions:**
  - **Quick Actions Panel (Right Top):** `Apply for a Loan`, `Make a Deposit`, `Buy Shares`, `Make a Payment`, `Update KYC Documents`.
  - **Recent Activity Feed (Right Middle):** Timestamped activity log (`Deposit received`, `Loan repayment`, `Share purchase`, `KYC document approved`, `Login`).
  - **Bottom PWA Promo Banner:** *"Get the FlexSACCO App - Access your account anytime, anywhere"* with QR Code and Install button.

---

## 3. Direct Download Engines for Stage 5

Members must be able to directly download financial statements and transaction receipts to their phone or computer:

### A. Endpoint: `GET /api/portal/export/statement`
- **File Output:** `Account_Statement_[MemberNo]_YYYY-MM-DD.pdf` (or `.csv` if `?format=csv`)
- **Headers Sent:**
  - `Content-Type: application/pdf` (or `text/csv`)
  - `Content-Disposition: attachment; filename="Account_Statement_M000123_2026-11-01.pdf"`
- **Contents:** Official SACCO header, Member Name, Member Number, Opening Balance, Itemized Transactions (Date, Description, Debit, Credit, Running Balance), and Closing Balance.

### B. Endpoint: `GET /api/portal/export/receipt/[txnId]`
- **File Output:** `Transaction_Receipt_[TxnID].pdf`
- **Headers Sent:**
  - `Content-Disposition: attachment; filename="Receipt_TXN_991823.pdf"`
- **Contents:** Printable official payment voucher showing SACCO stamp, Member Name, Amount (UGX), Payment Channel (MTN MoMo/Airtel/Bank), External Reference, and Timestamp.

---

## 4. Step-by-Step Implementation Tasks

### Task 5.1: PWA Setup & Manifest (`public/manifest.json`)
Configure Progressive Web App assets:
- `name`: "FlexSACCO Member Portal"
- `short_name`: "FlexSACCO"
- `theme_color`: "#0F5132"
- `background_color`: "#F8FAFC"
- `display`: "standalone"
- `start_url`: "/portal"
- `icons`: 192x192 and 512x512 maskable application icons.
- Add PWA register script in `app/(member-portal)/layout.tsx` that captures `beforeinstallprompt` to power the "Install App" buttons.

### Task 5.2: Member Portal Shell (`app/(member-portal)/portal/layout.tsx`)
- Clean, distraction-free member navigation with bottom mobile nav bar for mobile devices:
  - Bottom bar tabs: `Dashboard`, `Savings`, `Loans`, `Pay`, `Profile`.
- Integrates `components/shared/NotificationBell.tsx` with Supabase Realtime alerts.

### Task 5.3: Member Dashboard Page (`app/(member-portal)/portal/page.tsx`)
- Server component querying:
  - Logged-in member's profile (`profiles`).
  - Savings and Share Capital balances (`accounts`).
  - Active loan repayment status and schedule (`loans`).
  - Paginated recent transactions with pagination controls (`Showing 1-5 of 42 transactions`).
- Render Account Overview donut breakdown (SVG/Recharts).
- Render Active Loan card with `8 of 12 payments` visual progress bar.

### Task 5.4: Self-Service Modals & Direct Download Buttons
- **Direct Download Button:** "Download Full Statement (PDF)" on the transaction table header.
- **Deposit Modal:** Triggers deposit action (prepares for Stage 6 ioTec MoMo push).
- **Loan Application Wizard Modal:**
  - Select loan product (Agricultural, Business, School Fees).
  - Input requested amount and tenure in months.
  - Dynamically calculates estimated monthly installment before submission.
- **KYC Upload Modal:** Upload inputs for National ID (front/back) and passport photo storing directly to Supabase Storage bucket `kyc-documents`.

---

## 5. Mandatory Checks Per Stage (Automated & Manual)

The agent must run and pass all 5 verification checks before declaring Stage 5 complete:

```
+──────────────────────────────────────────────────────────────────────────+
|                          STAGE 05 VERIFICATION SUITE                     |
+──────────────────────────────────────────────────────────────────────────+
| [CHECK 1] Member Row-Level Security (RLS) Isolation Check                |
| [CHECK 2] PWA Manifest & Service Worker Installation Check               |
| [CHECK 3] Loan Progress & Amortization Math Invariant Check              |
| [CHECK 4] Direct Statement Download Headers & Attachment Check           |
| [CHECK 5] Mobile Viewport & Touch Target Standard Check                  |
+──────────────────────────────────────────────────────────────────────────+
```

### [CHECK 1] Member Row-Level Security (RLS) Isolation Check
* **Objective:** Verify member `John Muganzi` can never read another member's savings, loans, or transactions.
* **Test Procedure:**
  1. Authenticate with Member John's session token.
  2. Query `supabase.from('accounts').select('*')`.
  3. Query `supabase.from('loans').select('*')`.
* **Assertion:** 100% of returned records have `member_id === john_muganzi_id`. Attempting to query an account with another `member_id` returns an empty array.

### [CHECK 2] PWA Manifest & Service Worker Installation Check
* **Objective:** Verify application meets PWA criteria for home-screen installation on Android/iOS.
* **Test Procedure:**
  - Fetch `http://localhost:3000/manifest.json`.
* **Assertion:**
  - Status is `200 OK`.
  - JSON contains `display: "standalone"`, `start_url: "/portal"`, and at least two valid icons.
  - Service worker registers without console errors.

### [CHECK 3] Loan Progress & Amortization Math Invariant Check
* **Objective:** Ensure repayment progress bar mathematically reflects installments paid vs. total schedule.
* **Test Input:**
  - Loan Principal: `UGX 2,000,000` | Total Installments: `12`
  - Completed Repayments recorded: `8`
* **Assertion:**
  - Calculated progress is `66.67%` (`8 of 12 payments`).
  - Remaining balance displayed matches `principal + interest - total_paid`.

### [CHECK 4] Direct Statement Download Headers Check
* **Objective:** Verify member statement download triggers direct file saving.
* **Test Command:**
  ```bash
  curl -I -H "Cookie: [MEMBER_SESSION_COOKIE]" http://localhost:3000/api/portal/export/statement
  ```
* **Assertion:**
  - HTTP `200 OK`
  - `Content-Disposition` header contains `attachment; filename="Account_Statement_...`
  - `Content-Type` is `application/pdf` or `text/csv`

### [CHECK 5] Mobile Viewport & Touch Target Standard Check
* **Objective:** Verify portal is fully usable on mobile screens (Ugandan smartphone landscape: 360px width).
* **Test Procedure:**
  - Emulate viewport `360x640px` (Android entry-level device).
* **Assertion:**
  - Zero horizontal overflow scrollbars.
  - All interactive buttons (`Make Payment`, `Quick Actions`, Bottom navigation) have a minimum touch target height of `44px`.

---

## 6. Definition of Done
Stage 5 is complete only when:
1. Member Dashboard renders all balance cards, donut chart, and KYC checklist matching the wireframe.
2. The PWA manifest is active and the "Install App" button functions on compatible browsers.
3. The Active Loan card displays the progress bar and repayment schedule accurately.
4. Direct download buttons for the account statement and payment receipts trigger immediate file downloads.
5. All 5 Stage Checks pass with zero security or layout regressions.
```