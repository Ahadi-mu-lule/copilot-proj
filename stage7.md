The last stage is **Stage 07: In-App Real-Time Notifications, Future-Proof SMS Adapter & Production Hardening**.

This final stage ties the entire system together:
1. **Zero-Cost Real-Time In-App Alerts:** Live WebSocket notifications via Supabase Realtime for the bell icon in all three portals (Super Admin, Staff Workspace, and Member Portal).
2. **The Future-Proof SMS Adapter:** The zero-cost mock adapter (`NoopSmsProvider`) used in Years 0–2 that can be switched to real telecom gateways (Africa's Talking / Infobip) in Years 2–4 with a single environment variable—with zero code rewrite.
3. **Comprehensive Audit Logging:** System-wide audit trails with direct CSV download buttons for UMRA compliance.
4. **Final End-to-End Production Verification Checks:** Validating the complete lifecycle from SACCO onboarding to member deposit and loan payoff.

---

Here is the complete **`stages/07-notifications-sms-adapter.md`** file for your Antigravity workspace:

```markdown
# Stage 07: In-App Real-Time Notifications, Future-Proof SMS Adapter & Production Hardening

## 1. Objective
Complete the platform by implementing zero-cost real-time in-app notifications (Supabase Realtime WebSockets), configuring the pluggable SMS adapter (active zero-cost logger for Years 0–2, ready for direct SMS in Years 2–4), establishing regulatory audit trails with **direct download export engines**, and executing the **final end-to-end system checks**.

---

## 2. Notification & Messaging Architecture

```
                  [ SYSTEM EVENT OCCURS ]
   (Payment Received / Loan Approved / KYC Verified / SACCO Onboarded)
                             │
                             ▼
              [ Notification Dispatch Service ]
                             │
             ┌───────────────┴───────────────┐
             ▼                               ▼
    [ Real-Time In-App ]            [ SMS Gateway Router ]
    Supabase Realtime WebSocket     (Reads `SMS_PROVIDER` from .env)
             │                               │
             ▼                               ├──────────────────────────────┐
    UI Bell Badge Updates Live               ▼                              ▼
    (Increments counter without reload) [ Years 0 - 2 ]             [ Years 2 - 4 ]
                                        NoopSmsProvider             AfricasTalkingProvider
                                        • Zero Cost                 • Real Telecom SMS
                                        • Logs to DB audit table    • Activated via .env
```

---

## 3. Direct Download Engines for Stage 7

Administrators and compliance officers must be able to export audit logs and compliance reports directly:

### A. Endpoint: `GET /api/workspace/export/audit-logs`
- **File Output:** `[SACCO_Slug]_Audit_Logs_YYYY-MM-DD.csv`
- **Headers Sent:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="Kampala_SACCO_Audit_Logs_2026-11-01.csv"`
- **Columns Included:** `Timestamp`, `Actor Name`, `Actor Role`, `IP Address`, `Action Performed` (e.g., `LOAN_APPROVED`, `KYC_REJECTED`, `FUNDS_LIQUIDATED`), `Target Entity ID`, `Status`.

### B. Endpoint: `GET /api/admin/export/platform-audit`
- **File Output:** `FlexSACCO_Platform_Audit_YYYY-MM-DD.csv`
- **Purpose:** Super Admin audit trail of all tenant onboarding, subscription changes, and administrative overrides across Uganda.

---

## 4. Step-by-Step Implementation Tasks

### Task 4.1: Pluggable SMS Adapter Engine (`lib/notifications/sms-provider.ts`)
Implement the interface and concrete providers:
```typescript
export interface SmsProvider {
  sendSms(phoneNumber: string, message: string): Promise<boolean>;
}

// 1. ACTIVE TODAY (Years 0 - 2): Zero-Cost Logger
export class NoopSmsProvider implements SmsProvider {
  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    console.log(`[SMS Disabled - Simulating send to ${phoneNumber}]: ${message}`);
    // Record into internal audit log table for debugging without incurring SMS cost
    return true;
  }
}

// 2. FUTURE ADAPTER (Years 2 - 4): Africa's Talking / Infobip
export class AfricasTalkingSmsProvider implements SmsProvider {
  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    // Calls Africa's Talking Uganda SMS Gateway API
    return true;
  }
}

// Provider Factory
export function getSmsProvider(): SmsProvider {
  const providerType = process.env.SMS_PROVIDER || 'noop';
  if (providerType === 'africastalking') {
    return new AfricasTalkingSmsProvider();
  }
  return new NoopSmsProvider();
}
```

### Task 4.2: Real-Time In-App Notification Component (`components/shared/NotificationBell.tsx`)
- UI component showing:
  - Bell icon with unread count badge (`3`).
  - Dropdown sheet listing timestamped notifications with relative time (e.g., `2 hours ago`, `Just now`).
  - Click-through navigation to relevant record (`action_url`).
  - "Mark all as read" button.
- WebSocket Connection:
  - Establishes Supabase Realtime subscription on `notifications` table:
    ```typescript
    supabase
      .channel('member-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`,
      }, (payload) => {
        // Increment badge counter and display toast notification
      })
      .subscribe();
    ```

### Task 4.3: Regulatory Audit Trail Logging (`lib/services/audit-service.ts`)
- Implement `logAuditEvent({ saccoId, actorId, action, details, ipAddress })`.
- Writes immutable rows to `audit_logs` table.
- Enforce check: Audit log entries cannot be updated or deleted by any user (PostgreSQL rule: `REVOKE UPDATE, DELETE ON audit_logs`).

---

## 5. Mandatory Checks Per Stage (Automated & Manual)

The agent must run and pass all 5 verification checks before declaring Stage 7 and the entire platform complete:

```
+──────────────────────────────────────────────────────────────────────────+
|                          STAGE 07 VERIFICATION SUITE                     |
+──────────────────────────────────────────────────────────────────────────+
| [CHECK 1] Real-Time WebSocket Notification Delivery Check                |
| [CHECK 2] SMS Adapter Zero-Cost Default Invariant Check                   |
| [CHECK 3] Future-Proof SMS Adapter Hot-Swap Check                        |
| [CHECK 4] Direct Audit Log Download Headers Check                        |
| [CHECK 5] End-to-End System Smoke Test (Onboarding -> Payoff)            |
+──────────────────────────────────────────────────────────────────────────+
```

### [CHECK 1] Real-Time WebSocket Notification Delivery Check
* **Objective:** Ensure the notification bell increments live without requiring a page refresh.
* **Test Procedure:**
  1. Open the Member Portal in a browser window.
  2. In a separate terminal or API tool, insert a notification row for that member into the `notifications` table.
* **Assertion:** The red badge counter on the bell icon increments immediately in the open browser window within 500ms.

### [CHECK 2] SMS Adapter Zero-Cost Default Invariant Check
* **Objective:** Ensure no third-party HTTP requests to SMS gateways occur in default configuration.
* **Test Procedure:**
  - Trigger 10 member onboarding and deposit events with default environment variables.
* **Assertion:** Outbound network logs show zero calls to `api.africastalking.com` or any SMS endpoints. `NoopSmsProvider` intercepts all calls.

### [CHECK 3] Future-Proof SMS Adapter Hot-Swap Check
* **Objective:** Verify that switching to a paid SMS provider in the future requires only an environment variable change with zero code refactoring.
* **Test Procedure:**
  - Temporarily set `SMS_PROVIDER="africastalking"` in `.env`.
* **Assertion:** Factory function `getSmsProvider()` instantiates `AfricasTalkingSmsProvider` without application errors or missing dependencies.

### [CHECK 4] Direct Audit Log Download Headers Check
* **Objective:** Verify compliance audit logs download directly as CSV.
* **Test Command:**
  ```bash
  curl -I -H "Cookie: [STAFF_SESSION_COOKIE]" http://localhost:3000/api/workspace/export/audit-logs
  ```
* **Assertion:**
  - HTTP `200 OK`
  - `Content-Disposition` header contains `attachment; filename="...Audit_Logs...csv"`
  - `Content-Type` is `text/csv; charset=utf-8`

### [CHECK 5] End-to-End System Smoke Test
* **Objective:** Complete full financial and tenant lifecycle test:
  1. Super Admin onboards `Mbarara SACCO` (`/admin`).
  2. Staff bulk-imports members; unactivated member claims account with Phone + NIN (`/claim-account`).
  3. Member initiates UGX 50,000 deposit via ioTec MoMo push (`/portal`).
  4. Webhook confirms payment; member savings balance reflects UGX 50,000.
  5. Member applies for UGX 100,000 loan; Staff approves and disburses (`/workspace`).
  6. Repayment progress bar displays installment schedule accurately.
* **Assertion:** All 6 steps complete with zero errors and 100% tenant isolation.

---

## 6. Definition of Done (Final Project Completion)
The FlexSACCO Uganda platform is ready for production deployment when:
1. All 7 stage specification files exist in the `stages/` folder.
2. All 5 Stage Checks in this file pass successfully.
3. In-app notifications deliver instantly via Supabase Realtime.
4. The SMS adapter is safely initialized in zero-cost mode.
5. All direct-download endpoints (CSV, PDF, TXT) across all portals stream files correctly.
```