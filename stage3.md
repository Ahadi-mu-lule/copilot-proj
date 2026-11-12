Here is the complete **`stages/03-bulk-onboarding-zero-cost-activation.md`** file, formatted with strict verification checks, direct download engines, and zero-cost activation mechanics.

---

```markdown
# Stage 03: Bulk Member Onboarding & Zero-Cost Activation Engine

## 1. Objective
Enable SACCO Staff to bulk-import hundreds of legacy members via CSV/Excel, automatically create their initial Savings and Share Capital accounts, and activate them using **zero-cost channels** (WhatsApp `wa.me` links, NIN + Phone self-service claiming, and printable branch slips) with **direct download capabilities** and **automated stage checks**.

---

## 2. Direct Download Engines for Stage 3

The agent must implement three direct-download attachment endpoints:

1. **`GET /api/workspace/members/template`**:
   - Downloads `FlexSACCO_Member_Import_Template.csv`.
   - Headers: `Content-Disposition: attachment; filename="FlexSACCO_Member_Import_Template.csv"`.
   - Includes standard headers and two pre-filled example rows with valid Ugandan formats (`2567...`, NIN `CM...`/`CF...`).
2. **`GET /api/workspace/members/import-errors?batchId={id}`**:
   - Direct CSV download listing all rejected rows from a failed import with reasons (e.g., `Row 12: Duplicate NIN CM90021...`).
3. **`GET /api/workspace/members/export-slips?batchId={id}`**:
   - Direct PDF download containing 8 printable membership activation slips per A4 sheet with Member Number, Name, Temporary PIN, and portal URL.

---

## 3. Step-by-Step Implementation Tasks

### Task 3.1: Data Sanitization & Import Service (`lib/services/import-service.ts`)
Implement parsing and validation logic:
- **Phone Number Normalizer:** Converts any Ugandan input (`0772123456`, `+256772123456`, `772123456`) into canonical format `256772123456`. Rejects invalid lengths.
- **NIN Validator:** Verifies 14-character Ugandan National Identification Number format (starts with `CM` for male, `CF` for female, or standard alien card prefixes).
- **Opening Balance Validation:** Ensures `opening_savings >= 0` and `opening_shares >= 0`.

### Task 3.2: Atomic Batch Ingestion Action (`lib/actions/member-import.ts`)
Create `importMembersBatchAction(saccoId, rows)`:
1. Verify user has role `sacco_admin` or `sacco_staff` and belongs to `saccoId`.
2. Execute batch insertion inside a PostgreSQL transaction:
   - Insert rows into `profiles` with `is_activated = false`, `activation_token = crypto.randomUUID()`.
   - Insert corresponding records into `accounts` for:
     - `account_type = 'savings'`
     - `account_type = 'share_capital'`
   - Auto-generate sequential `member_number` (e.g., `M-00101`, `M-00102`).
3. Return `{ success: true, count: number, batchId: string }`.

### Task 3.3: Bulk Import UI (`app/(sacco-staff)/workspace/members/import/page.tsx`)
- Drag-and-drop CSV upload zone.
- **Direct Download Button:** "Download CSV Template".
- **Dry-Run Pre-flight Table:** Shows previews of parsed rows with status badges:
  - `Valid` (Green)
  - `Error` (Red, displays exact field issue)
- **Direct Download Button:** "Export Error Log (CSV)" if errors exist.
- "Confirm & Ingest Members" button (disabled if critical validation errors exist).

### Task 3.4: Zero-Cost Activation Generators
1. **WhatsApp Deep-Link (`wa.me`) Generator:**
   - Helper `generateWhatsAppInviteLink(phone, fullName, saccoName, token)`:
     - Returns `https://wa.me/{phone}?text={encodedGreeting}`.
     - Message: *"Hello {fullName}, welcome to {saccoName}. Your membership is ready. Tap to set your PIN: https://flexsacco.ug/claim-account?token={token}"*.
   - Next to each imported member in the directory, render a direct green "Send WhatsApp Invite" button.
2. **Printable Slips Engine (`app/api/workspace/members/export-slips/route.ts`):**
   - Generates clean, printer-friendly PDF containing 8 slips per page.
   - Includes SACCO name, Member ID, Full Name, Temp PIN, and instructions to visit the branch or portal.

### Task 3.5: Public Self-Service Account Claiming (`app/(auth)/claim-account/page.tsx`)
1. Member arrives at `/claim-account` (on mobile or desktop).
2. Form fields:
   - SACCO selector or auto-detected from subdomain/slug.
   - Phone Number (e.g. `077...`).
   - National ID (NIN).
3. Verification:
   - Queries database for `profiles` matching `sacco_id`, `phone_number`, and `national_id_nin` where `is_activated = false`.
   - If matched, prompts member to create a 4-digit security PIN or password.
   - Marks `is_activated = true`, invalidates `activation_token`, and logs user in directly. **Zero SMS sent.**

---

## 4. Mandatory Checks Per Stage (Automated & Manual)

The agent must run and pass all 5 verification checks before declaring Stage 3 complete:

```
+──────────────────────────────────────────────────────────────────────────+
|                          STAGE 03 VERIFICATION SUITE                     |
+──────────────────────────────────────────────────────────────────────────+
| [CHECK 1] Schema & Phone Sanitization Unit Check                         |
| [CHECK 2] Multi-Tenant Data Leak Isolation Check                         |
| [CHECK 3] Zero-SMS Cost Invariant Check                                  |
| [CHECK 4] Direct File Download Headers Check                             |
| [CHECK 5] Self-Service Account Claiming Idempotency Check                |
+──────────────────────────────────────────────────────────────────────────+
```

### [CHECK 1] Schema & Phone Sanitization Check
* **Objective:** Ensure invalid Ugandan phone numbers and malformed NINs are intercepted prior to database writes.
* **Test Input:**
  - Phone `0782111222` -> Expect: `256782111222` (Pass)
  - Phone `+256701999888` -> Expect: `256701999888` (Pass)
  - Phone `12345` -> Expect: Error rejected (Pass)
  - NIN `CM89012345ABCD` -> Expect: Valid 14-char format (Pass)
  - NIN `INVALID` -> Expect: Error rejected (Pass)

### [CHECK 2] Multi-Tenant Data Leak Isolation Check
* **Objective:** Ensure members bulk-imported into SACCO A are never visible or queryable by SACCO B.
* **Test Procedure:**
  1. Authenticate as staff member of `Kampala SACCO` (`sacco_id_1`).
  2. Bulk import 5 members.
  3. Authenticate as staff member of `Luwero SACCO` (`sacco_id_2`).
  4. Query `/workspace/members`.
* **Assertion:** Result must return `0` records from `sacco_id_1`.

### [CHECK 3] Zero-SMS Cost Invariant Check
* **Objective:** Verify no paid telecom SMS gateway is triggered during bulk upload or activation.
* **Test Procedure:**
  1. Trigger 20 member activations via the import workflow.
  2. Inspect outbound network requests or server logs.
* **Assertion:** Zero HTTP calls made to Africa's Talking, Twilio, or external SMS aggregators. All actions route to `NoopSmsProvider` or `wa.me` client-side deep links.

### [CHECK 4] Direct File Download Headers Check
* **Objective:** Verify files download directly to the user's computer without opening a new preview tab or failing CORS.
* **Test Command (via curl or browser):**
  ```bash
  curl -I http://localhost:3000/api/workspace/members/template
  ```
* **Assertion:**
  - HTTP `200 OK`
  - `Content-Disposition` header contains `attachment; filename="FlexSACCO_Member_Import_Template.csv"`
  - `Content-Type` is `text/csv; charset=utf-8`

### [CHECK 5] Self-Service Account Claiming Idempotency Check
* **Objective:** Ensure an activated member cannot be hijacked or re-claimed.
* **Test Procedure:**
  1. Member claims account successfully with NIN `CM9001` and Phone `256770000000`. Sets PIN `1234`. Status becomes `is_activated = true`.
  2. Attempt to claim the same account again with the same credentials.
* **Assertion:** System returns: `"Account already activated. Please log in directly."`

---

## 5. Definition of Done
Stage 3 is complete only when:
1. The CSV template download button works directly.
2. A sample 20-member CSV imports without errors into Supabase.
3. WhatsApp `wa.me` links open WhatsApp with pre-filled tokens.
4. An unactivated member can claim their account on `/claim-account` using Phone + NIN at zero SMS cost.
5. All 5 Stage Checks pass.
```