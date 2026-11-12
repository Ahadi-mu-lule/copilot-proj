Here is the complete **`stages/04-staff-workspace-operations.md`** file, equipped with branch workflows, loan appraisal rules, direct download export engines, and the mandatory verification checks suite.

---

```markdown
# Stage 04: SACCO Staff Workspace (Operations, KYC & Loan Pipeline)

## 1. Objective
Build the day-to-day branch operating cockpit (`/workspace`) for SACCO Managers, Loan Officers, and Cashiers. This includes member directory management, the KYC verification desk, the loan appraisal and approval pipeline, and **direct-download financial exports**, backed by strict multi-tenant isolation and stage verification checks.

---

## 2. Target UI Layout & Components (Strictly Matching Wireframes)
The Staff Workspace must replicate the layout in the system designs:
- **Header:** SACCO Name (e.g., `Kampala SACCO`), Staff User (`Grace N. Muwanga - SACCO Manager`), live date/time, member/loan search bar, and real-time Notification Bell with unread counter.
- **KPI Metrics Cards (Top Row):**
  - **Total Members:** `2,340` (`↑ 5% this month`)
  - **Total Savings:** `UGX 412,580,000` (`↑ 8% this month`)
  - **Total Shares:** `UGX 298,450,000` (`↑ 6% this month`)
  - **Total Loan Portfolio:** `UGX 1,245,300,000` (`↑ 12% this month`)
- **Analytics & Visuals (Middle Row):**
  - **Financial Overview:** Multi-line graph tracking Savings, Shares, and Loans over 10 months.
  - **Member & Loan Distribution:** Donut chart showing Active (85%), On Hold (9%), and Dormant (6%) members.
- **Operations & Queues (Bottom Grid):**
  - **Recent Transactions Table:** Date, Member Name, Type (`Savings Deposit`, `Loan Repayment`, `Share Purchase`, `Loan Disbursement`, `Savings Withdrawal`), Amount (UGX), Status (`Completed`), Action (`View`).
  - **Loan Applications Pipeline:** Member Name, Amount (UGX), Status (`Pending`, `Under Review`, `Approved`, `Disbursed`, `Rejected`), Application Date.
  - **Pending Approvals Queue (Right Sidebar):**
    - High-priority approvals list with elapsed time badges:
      - `Loan application requires approval` (e.g., Tumusiime Robert - UGX 3,000,000)
      - `New member registration` (Nankinga Sheila)
      - `KYC documents pending review` (Ssempebwa Ronald)
      - `Transaction requires verification` (Kato Joseph - UGX 500,000)
- **Quick Actions Panel:**
  - `Register New Member`
  - `Process Loan Application`
  - `Record Savings Deposit`
  - `Record Share Purchase`
  - `Make a Payment/Transaction`
  - `Generate Financial Report` (**triggers direct download**)

---

## 3. Direct Download Engines for Stage 4

Direct file download endpoints must stream data directly to the user's browser using `Content-Disposition: attachment` headers:

### A. Endpoint: `GET /api/workspace/export/transactions`
- **File Output:** `Kampala_SACCO_Transactions_YYYY-MM-DD.csv`
- **Headers Sent:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="Kampala_SACCO_Transactions_2026-11-01.csv"`
- **Columns Included:** `Transaction ID`, `Date`, `Member Number`, `Member Name`, `Type`, `Amount (UGX)`, `Payment Channel`, `Status`, `Reference ID`.

### B. Endpoint: `GET /api/workspace/export/loan-portfolio`
- **File Output:** `Kampala_SACCO_Loan_Book_YYYY-MM-DD.csv`
- **Columns Included:** `Loan ID`, `Member Number`, `Borrower Name`, `Principal (UGX)`, `Interest Rate (%)`, `Tenure (Months)`, `Outstanding Balance (UGX)`, `Next Due Date`, `Arrears (UGX)`, `Status`.

### C. Endpoint: `GET /api/workspace/loans/[id]/schedule-pdf`
- **File Output:** `Loan_Amortization_Schedule_[LoanID].pdf`
- **Purpose:** Generates a printable monthly repayment schedule (Principal, Interest, Monthly Installment, Due Date) for the borrower.

---

## 4. Step-by-Step Implementation Tasks

### Task 4.1: Workspace Layout & Navigation (`app/(sacco-staff)/workspace/layout.tsx`)
- Sidebar navigation: Dashboard, Members, KYC Management, Savings & Shares, Loans, Payments & Transactions, Accounting & Ledger, Reports, Audit Logs, Settings.
- Dynamic branding: Reads current staff member's `sacco_id` and renders their SACCO name dynamically.
- Includes `components/shared/NotificationBell.tsx` connected to Supabase Realtime.

### Task 4.2: Staff Overview Dashboard (`app/(sacco-staff)/workspace/page.tsx`)
- Server component querying:
  - Total aggregated savings and share balances for the active `sacco_id`.
  - Active loan balance and portfolio size.
  - Top 5 recent transactions with pagination controls (`Showing 1-5 of 42 transactions`).
  - Pending approval count query powering the right-hand action cards.
- Render Quick Actions sidebar with direct download links.

### Task 4.3: KYC Verification Desk (`app/(sacco-staff)/workspace/kyc/page.tsx`)
- KYC document gallery for unverified members:
  - Side-by-side view: National ID Front, National ID Back, Passport Photo, Proof of Residence.
  - Member details: Full Name, NIN, Phone, Date of Birth.
- Action Buttons:
  - `Approve KYC`: Updates `profiles.kyc_status = 'verified'` and creates an in-app notification for the member.
  - `Reject KYC`: Requires rejection reason (e.g., "Blurry National ID document"), updates status to `rejected`, and notifies member to re-upload.

### Task 4.4: Loan Appraisal & Approval Engine (`app/(sacco-staff)/workspace/loans/page.tsx`)
- Multi-stage pipeline: `Pending` -> `Under Review` -> `Approved` -> `Disbursed` -> `Rejected`.
- **Appraisal Calculation Modal:**
  - Enforces Ugandan SACCO credit ratio rules:
    $$\text{Max Eligible Loan} = (\text{Savings Balance} + \text{Share Capital}) \times 3.0$$
  - Displays borrower savings balance, active share capital, outstanding debts, and calculated Debt-to-Savings ratio.
- Actions:
  - `Move to Under Review`: Assigns loan officer.
  - `Approve Loan`: Sets `status = 'approved'`, records `approved_by = auth.uid()`.
  - `Disburse Loan`: Sets `status = 'disbursed'`, timestamps `disbursed_at = NOW()`, sets initial `next_payment_due`, and generates the repayment installment schedule.

---

## 5. Mandatory Checks Per Stage (Automated & Manual)

The agent must run and pass all 5 verification checks before declaring Stage 4 complete:

```
+──────────────────────────────────────────────────────────────────────────+
|                          STAGE 04 VERIFICATION SUITE                     |
+──────────────────────────────────────────────────────────────────────────+
| [CHECK 1] Multi-Tenant Staff Data Boundary Check                         |
| [CHECK 2] KYC Status Pre-Condition Invariant Check                       |
| [CHECK 3] Loan Appraisal Ratio & Calculation Check                       |
| [CHECK 4] Direct File Download Headers & Attachment Check                |
| [CHECK 5] Pending Approvals Triage Reactive Check                        |
+──────────────────────────────────────────────────────────────────────────+
```

### [CHECK 1] Multi-Tenant Staff Data Boundary Check
* **Objective:** Verify that staff from SACCO A can NEVER see or export transactions, loans, or member records belonging to SACCO B.
* **Test Procedure:**
  1. Authenticate as Manager Grace (`sacco_id_kampala`).
  2. Request `/api/workspace/export/transactions`.
  3. Inspect returned CSV rows.
* **Assertion:** Every row has `sacco_id === sacco_id_kampala`. Zero records from other SACCOs exist in the file.

### [CHECK 2] KYC Status Pre-Condition Invariant Check
* **Objective:** Ensure a member with `kyc_status = 'pending'` or `'rejected'` CANNOT have a loan disbursed.
* **Test Procedure:**
  1. Create a loan application for an unverified member.
  2. Attempt to call `disburseLoanAction(loanId)`.
* **Assertion:** Server Action throws: `"Cannot disburse loan: Member KYC is not verified."` Status remains untouched.

### [CHECK 3] Loan Appraisal Ratio & Calculation Check
* **Objective:** Verify that the appraisal logic accurately flags over-leveraged borrowers.
* **Test Input:**
  - Member Savings: UGX 1,000,000 | Share Capital: UGX 500,000 (Total: UGX 1,500,000)
  - Requested Loan: UGX 7,000,000 (Multiple: 4.67x)
* **Assertion:** Appraisal modal flags: `"Warning: Loan exceeds standard 3.0x savings ratio threshold"`. Requires explicit manager override acknowledgment before approval.

### [CHECK 4] Direct File Download Headers Check
* **Objective:** Verify transaction and portfolio exports trigger immediate browser downloads.
* **Test Command:**
  ```bash
  curl -I -H "Cookie: [STAFF_SESSION_COOKIE]" http://localhost:3000/api/workspace/export/transactions
  ```
* **Assertion:**
  - HTTP `200 OK`
  - `Content-Disposition` header starts with `attachment; filename=`
  - `Content-Type` is `text/csv; charset=utf-8`

### [CHECK 5] Pending Approvals Triage Reactive Check
* **Objective:** Verify that approving a pending item immediately decrements the counter and updates the UI queue.
* **Test Procedure:**
  1. Queue displays `4 pending approvals`.
  2. Staff approves the pending KYC document for `Ssempebwa Ronald`.
  3. Re-query pending approvals.
* **Assertion:** Pending count decrements to `3`, and the approved document drops off the pending queue.

---

## 6. Definition of Done
Stage 4 is complete only when:
1. Staff Dashboard displays all 4 KPI cards and both charts matching the Kampala SACCO wireframe.
2. The KYC verification interface allows approving and rejecting uploaded documents.
3. Loan applications can progress from `pending` through appraisal to `disbursed`.
4. Direct download buttons for transaction CSV, loan book CSV, and repayment schedule PDF work immediately.
5. All 5 Stage Checks pass without regression.
```