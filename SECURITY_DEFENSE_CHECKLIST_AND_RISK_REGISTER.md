# FlexSACCO Security Defense Pack

**Purpose:** Supervisor-ready security checklist, project risk register, and security status matrix for the seven FlexSACCO stages.

**Review scope and status:** This assessment reviews the stage specifications in `stage1.md` through `stage7.md` and the security design described in the repository. It is a design review, not a penetration test or code audit. The repository currently contains project specifications rather than a complete running application, so no implementation control can be marked **Pass** based on these documents alone. Status definitions used here:

- **Pass** — the control is implemented and supported by reproducible evidence/tests.
- **Fix** — the design or implementation needs a specific correction before the stage can pass.
- **Blocker** — do not use live personal/financial data or real-money transactions until the issue is fixed and independently tested.

**Overall conclusion:** The blueprint contains useful security intentions, including RLS, tenant isolation, and payment idempotency checks. However, several proposed flows are unsafe as written—especially account claiming, payment webhook handling, direct balance updates, and PWA offline caching. For a live-money launch, Stages 1, 2, 3, 4, 5, 6, and 7 all remain **Blocker** until the applicable controls below are implemented and evidenced. This does not prevent a clearly labeled prototype using synthetic data and mocked payments.

---

## A. Security checklist for final-year defense

Use this checklist as a defense preparation and release-gate document. Mark a control complete only when you can show its implementation and a test result. Record evidence links, test IDs, or screenshots in your project report.

### 1. Scope, data, and threat model

- [ ] Identify assets: member identity/KYC data, credentials/sessions, balances, loans, payment references, SACCO wallet identifiers, provider secrets, exports, audit records.
- [ ] Identify trust boundaries: public landing page, authenticated browser, Next.js server, Supabase database/storage/realtime, payment provider, webhook endpoint, staff devices.
- [ ] List attacker types: unauthenticated visitor, malicious member, compromised staff account, dishonest insider, cross-tenant user, replaying/malicious webhook sender, exposed credential holder.
- [ ] Document abuse cases: account takeover, member enumeration, privilege escalation, cross-SACCO access, forged/replayed payment callback, double credit, unauthorized disbursement, sensitive export theft.
- [ ] Separate demo/prototype, test/sandbox, and production environments; use synthetic data in demos and tests.
- [ ] State the system limitations honestly: a final-year project security review is not a security certification or proof that compromise is impossible.

**Defense evidence:** one-page data-flow diagram, assets/threat table, environment separation notes.

### 2. Authentication and account lifecycle (Stage 1)

- [ ] Supabase Auth is the source of identity; every protected server page/action/API validates the user with the supported server-side auth client.
- [ ] Missing, disabled, or unprovisioned profile and unknown role fail closed.
- [ ] Role and `sacco_id` are sourced from trusted server/database state—not form fields, URL parameters, browser state, or user-editable metadata.
- [ ] Admin and staff accounts require MFA; high-risk operations require step-up authentication where supported.
- [ ] No shared/default passwords or four-digit PIN-only authentication for financial access.
- [ ] Password reset, invite, callback, and return URLs are safe; redirect destinations are restricted to allowed same-origin URLs.
- [ ] Session revocation is addressed after role changes, account suspension, password reset, and suspected compromise.
- [ ] Login/reset/claim flows are rate-limited and do not disclose whether a phone, email, NIN, or member exists.
- [ ] Authentication secrets and session tokens are not stored in `localStorage`, URLs, source code, logs, or analytics.

**Defense evidence:** auth flow diagram, role tests, MFA configuration evidence, session/revocation test.

### 3. Authorization and tenant isolation (Stage 1; applies to all stages)

- [ ] RLS is enabled on every exposed tenant or sensitive table, including profiles, accounts, loans, transactions, notifications, KYC metadata/files, audit, import batches, and future ledger tables.
- [ ] Policies use default-deny and explicitly scope each `SELECT`, `INSERT`, `UPDATE`, and `DELETE`; writes include appropriate `WITH CHECK` conditions.
- [ ] Member reads are limited to that member's own records; staff reads/writes are limited to their SACCO and assigned permissions.
- [ ] Tenant IDs, member IDs, roles, approval actors, balances, transaction status, wallet IDs, and ledger rows cannot be set or changed by untrusted browser writes.
- [ ] Composite foreign keys or equivalent database constraints prevent accounts, loans, and transactions from referring to a member/account in another SACCO.
- [ ] Direct API/database tests with SACCO A credentials cannot read or modify SACCO B data, even by guessing/swapping UUIDs.
- [ ] Super-admin access is a deliberate, narrow, audited exception; it is not implemented by bypassing tenant checks everywhere.
- [ ] Service-role key is server-only and used only in the minimum necessary trusted operations; service-role calls validate tenant relationships explicitly.
- [ ] `SECURITY DEFINER` functions pin a safe `search_path`, qualify objects, validate caller/arguments, and restrict `EXECUTE` grants.

**Defense evidence:** RLS policy migration, database grants, cross-tenant automated test report for every sensitive table and operation.

### 4. SACCO onboarding and privilege management (Stage 2)

- [ ] Public demo requests cannot create tenants, auth users, admin roles, wallets, or payment access.
- [ ] Organization application moves through approved server-side states (e.g. pending review → approved → provisioning → setup required → active); illegal transitions fail.
- [ ] An authorized reviewer approves an application before provisioning; approval and provisioning actions are audited.
- [ ] Tenant creation and invitations are idempotent and safe to retry.
- [ ] Provider wallet IDs are verified with the provider; they are not generated as mock UUIDs for production.
- [ ] Payment enablement is a separate, default-disabled gate after sandbox validation and wallet verification.
- [ ] Initial administrator is invited individually, sets their own credential, and enrolls in MFA; no shared credentials.
- [ ] Staff permissions follow least privilege and use separation of duties for high-impact actions.
- [ ] Suspension/offboarding blocks new activity, revokes/reviews sessions, disables payments, and preserves required audit records.

**Defense evidence:** onboarding state machine, unauthorized transition tests, invite tests, mocked/sandbox setup demo.

### 5. Bulk import and member account claiming (Stage 3)

- [ ] Member import actions authenticate staff and derive the tenant from the staff profile, not a caller-supplied `saccoId`.
- [ ] CSV parsing is server-validated for size, row count, encoding, schema, numeric range, duplicate records, and malformed input.
- [ ] Import is transactional or safely resumable; duplicate submissions cannot create duplicate profiles/accounts.
- [ ] Import errors, templates, and reports are private and scoped to the requesting SACCO; exports escape spreadsheet formula cells (e.g. values beginning with `=`, `+`, `-`, `@`).
- [ ] NIN, phone, and sensitive import data are not included in public example templates, logs, URLs, or broadly accessible error exports.
- [ ] Replace NIN+phone-only account claim with an independently verified enrollment mechanism. Phone + NIN alone is not reliable proof of identity.
- [ ] Activation token is generated with cryptographic randomness, stored only as a hash, expires, is single-use, revocable, and rate-limited.
- [ ] Activation links/tokens are not leaked in logs, analytics, referer headers, WhatsApp message logs, or public pages; no temporary PIN/password is printed.
- [ ] Claim responses are generic and prevent member enumeration; account linking occurs in a server-side database transaction.
- [ ] Test expired, guessed, replayed, revoked, wrong-tenant, and already-used tokens.

**Defense evidence:** import boundary tests, token lifecycle tests, enumeration test, sanitized synthetic import sample.

### 6. Staff workspace, KYC, loans, and exports (Stage 4)

- [ ] Staff role/permission and tenant are rechecked server-side for every action and data request; middleware is not treated as the security boundary.
- [ ] KYC files live in a private storage bucket with restrictive object policies and short-lived signed access; no public bucket or permanent public URLs.
- [ ] KYC access and decisions are audited; collect/view only fields needed for the assigned task and mask NIN where possible.
- [ ] Loan eligibility calculations, status transitions, KYC prerequisites, limits, and approvals are enforced server-side/database-side, not only in the UI.
- [ ] Separate loan maker/reviewer/approver/disburser permissions where appropriate; prevent self-approval for designated actions.
- [ ] High-value or exceptional approvals require second approval or documented override reason.
- [ ] Exports authorize the caller, scope rows to their SACCO, limit date range/volume, log the export, and avoid unnecessary PII.
- [ ] CSV export protects against formula injection; filenames and content headers are safely constructed.
- [ ] Repeated or concurrent approval requests cannot bypass state transitions or cause duplicate disbursement.

**Defense evidence:** role-action matrix, KYC storage tests, unauthorized export test, loan status/approval tests.

### 7. Member portal and PWA (Stage 5)

- [ ] Member data queries are server-authorized and protected by RLS; changing another member's record ID returns no data.
- [ ] Service worker does not cache private balances, statements, KYC, session responses, or authenticated API responses for offline use.
- [ ] Offline behavior is disabled for sensitive views or uses a reviewed design that prevents shared-device disclosure and stale financial data confusion.
- [ ] Logout and account suspension clear app-visible private cached content and terminate subscriptions.
- [ ] Browser storage contains no access/refresh tokens or sensitive identity/payment data.
- [ ] Statement/receipt endpoints reauthorize each request and verify requested transaction belongs to the authenticated member and tenant.
- [ ] KYC upload validates type/size, uses private storage, prevents path traversal/overwrite, and checks file access policies.
- [ ] Realtime subscriptions are authorized and scoped; unsubscribe on logout/unmount; notification content exposes minimum necessary information.
- [ ] Third-party scripts, analytics, and external resources are minimized; security headers and a reviewed Content Security Policy are configured.

**Defense evidence:** PWA cache inspection, cross-member statement test, storage policy test, logout-on-shared-device test.

### 8. Payments, webhooks, ledger, and disbursements (Stage 6 — live-money blocker)

- [ ] Provider credentials and service-role key are stored in server-side secret management, never in the browser or repository.
- [ ] Deposit initiation is server-side; caller cannot choose tenant wallet, account owner, status, or arbitrary external reference.
- [ ] Validate amount, currency, account ownership, tenant, limits, and provider-approved destination before calling provider.
- [ ] Transaction row and provider request handling are consistent under timeouts/retries; use an idempotency key and reconciliation for ambiguous outcomes.
- [ ] Verify webhook authenticity using provider-supported signature verification over the raw body or strongest documented provider mechanism; compare secrets safely and rotate them. Do not assume a header secret alone prevents replay.
- [ ] Validate payload schema, timestamp/replay protections where available, provider event ID, external reference, wallet, expected amount, currency, and valid transaction state before any status mutation.
- [ ] Lookup/validate the pending transaction and tenant before marking either success or failure; no invalid/mismatched callback changes state.
- [ ] Callback processing is idempotent under repeated and concurrent delivery; provider transaction IDs/event IDs are unique where feasible.
- [ ] A single database transaction performs the valid status transition, balance effect, balanced double-entry journal entries, and durable processing/audit record.
- [ ] Check database/RPC errors; callback success is not returned if the financial operation failed.
- [ ] Browser clients cannot directly edit balances, transaction status, or ledger lines.
- [ ] Disbursements and bank changes require strict authorization, step-up MFA, limits, dual approval, verified destination, and audit record.
- [ ] Reconciliation detects provider/database/ledger differences and has a documented manual exception process.
- [ ] Test webhook spoof, wallet mismatch, amount/currency mismatch, unknown reference, failure event, replay, concurrent duplicate, out-of-order callback, timeout, and database failure. Verify no inappropriate balance or ledger mutation.
- [ ] Run tests only in sandbox/mock environments; do not use real funds for security demonstrations.

**Defense evidence:** webhook test matrix, atomic function migration/review, replay/idempotency test output, ledger balancing query, sandbox reconciliation.

### 9. Notifications, realtime, SMS, audit, and production hardening (Stage 7)

- [ ] Realtime publication and RLS prevent one user/tenant from subscribing to another's notification records.
- [ ] Notification writes are server-controlled; `user_id`, `sacco_id`, action URL, and message content are validated.
- [ ] Action URLs are internal/allowlisted to prevent open redirects or malicious links.
- [ ] SMS defaults fail-safe to `noop`; unknown provider configuration fails closed rather than silently enabling a paid integration.
- [ ] SMS adapter never logs full message content, OTPs, tokens, NIN, balances, or sensitive account data.
- [ ] Audit logs are append-only for application roles, private, monitored, and do not contain secrets or unnecessary personal data.
- [ ] CSV exports of audit logs are restricted, tenant-scoped, rate-limited, formula-safe, and themselves audited.
- [ ] Alert on repeated authentication failures, privilege changes, tenant/wallet mismatch, suspicious payment activity, and repeated webhook failure.
- [ ] CI includes dependency and secret scanning, lint/type checks, authorization/RLS tests, and reproducible build checks.
- [ ] Backups and restore are tested; incident contacts and response steps are documented; production secrets can be rotated.
- [ ] Security headers, HTTPS, CSP, error handling, logging redaction, and environment separation are verified.

**Defense evidence:** CI reports, realtime isolation test, SMS network-call test, audit/export authorization tests, backup restore record.

### 10. Final oral-defense summary

A concise statement suitable for presentation:

> “FlexSACCO uses layered security: authenticated identities, server-side role checks, PostgreSQL Row Level Security, tenant-consistency constraints, controlled onboarding, and audited financial workflows. Security is verified through cross-tenant, privilege, claim-token, export, and payment replay tests. The design is not considered safe for live funds until all critical controls pass in a sandbox and the payment ledger receives an independent review.”

Do not claim production certification, complete compliance, or that hacking is impossible. Explain what you implemented, how you tested it, what remains incomplete, and how the remaining risks are controlled.

---

## B. Risk register

Scales: **Critical / High / Medium / Low** severity. Likelihood is an initial design estimate (High / Medium / Low), not a measured incident probability. Residual risk remains until mitigation is implemented and tested.

| ID | Severity / likelihood | Stage | Risk and likely attack | Impact | Required mitigation / evidence |
|---|---|---|---|---|---|
| R1 | Critical / High | 1, all | Incomplete RLS lets a member/staff user query or modify another tenant's rows by changing UUIDs or calling Supabase directly. | Cross-SACCO privacy breach; financial data manipulation. | Default-deny RLS for every exposed table and operation, explicit write checks, composite tenant foreign keys; automated two-tenant tests through API and database roles. Block live use until passed. |
| R2 | Critical / Medium | 1, 2 | Role or `sacco_id` accepted from client/profile metadata, enabling self-promotion or tenant switching. | Platform takeover or cross-tenant access. | Assign roles/tenant only in trusted provisioning functions; protect profile columns; recheck every server action; audit role changes; test escalation attempts. |
| R3 | Critical / Medium | 1, 2 | Service-role key leaks through client bundle, logs, Git, or compromised server environment. | RLS bypass and full database compromise. | Secret manager, server-only module boundary, no browser exposure, scanning/rotation, minimal service-role use; inspect built assets and secret-scanning results. |
| R4 | High / High | 2 | Public onboarding or weak approval flow creates fraudulent SACCO/admin account or enables payment access. | Fraud, tenant abuse, data exposure. | Application/review/provision/activation states; authorized approval; invite-only admins with MFA; payments separately disabled; transition authorization tests. |
| R5 | Critical / High | 3 | Attacker claims victim account using only phone + NIN or enumerates registered members. | Account takeover and personal-data disclosure. | Remove phone+NIN as sole proof; verified enrollment, hashed expiring single-use token, generic responses, rate limits, privacy-safe verification; replay/enumeration tests. |
| R6 | High / Medium | 3 | Activation token/temporary PIN exposed in WhatsApp URL, printed slip, referrer/log, or weak random generation. | Account takeover, persistent unauthorized access. | Cryptographic high-entropy token, hash-at-rest, short TTL, one-time use, no temporary PIN, avoid token leakage and add `Referrer-Policy`; test expiry/replay. |
| R7 | High / Medium | 3 | Malicious or malformed CSV causes data corruption, oversized import, formula injection in exported error files, or cross-tenant import. | Data loss, staff compromise, data leakage. | Server validation, strict size/row limits, transaction/batch idempotency, tenant derived from staff, safe CSV escaping, import audit/reversal; adversarial file tests. |
| R8 | Critical / Medium | 4 | Staff account compromise or excessive permissions approves fraudulent loan, KYC, or disbursement. | Direct financial loss and identity fraud. | MFA, least-privilege granular roles, step-up auth, maker/checker, limits, no self-approval, audit and alerts; unauthorized/concurrent approval tests. |
| R9 | High / Medium | 4 | KYC files stored in public bucket or exposed through permanent URLs/broad exports. | NIN/photo disclosure and identity fraud. | Private bucket, strict object-level policies, short-lived signed URLs, minimal data access, access audit, retention controls; test as anonymous and other-tenant user. |
| R10 | High / Medium | 4, 5, 7 | Export endpoint lacks independent authorization or tenant scoping; CSV causes formula execution when opened. | Bulk data exfiltration or endpoint abuse. | Server auth/RLS, scoped query, volume limits, audit export, escape spreadsheet formulas, test unauthorized IDs and malicious cells. |
| R11 | High / Medium | 5 | PWA service worker caches authenticated balances/statements on shared phone or shows stale balances as current. | Privacy exposure and misleading financial information. | Do not cache authenticated financial/KYC responses; clear on logout; label stale data if any explicitly approved offline design; inspect cache on shared device. |
| R12 | Critical / High | 6 | Forged webhook or shared-secret leak marks fake payment successful. | Unauthorized credit, ledger imbalance, financial loss. | Provider-supported signature/raw-body validation, secret rotation, input validation, independent provider status check when available, no state changes before authenticity and transaction checks. Sandbox spoof tests. |
| R13 | Critical / High | 6 | Replayed or concurrent webhook credits the same deposit more than once. | Duplicate balance increases and financial loss. | Unique event/provider ID, idempotent DB function, row locking/state transition, unique constraints; replay/concurrency tests assert exactly one ledger effect. |
| R14 | Critical / Medium | 6 | Webhook accepts wrong wallet, amount, currency, external reference, or updates a failed/unknown transaction. | Cross-tenant credit, transaction fraud. | Compare expected transaction and tenant wallet/amount/currency/reference/state before any status update; failure events also require validation; mismatch tests prove no mutation. |
| R15 | Critical / Medium | 6 | Balance update is non-atomic or RPC error ignored; balance, transaction, and journal diverge. | Lost/duplicate funds; untrustworthy accounting. | One transaction for status, balanced debit/credit ledger, account effect, provider event; check errors and reconciliation; forced-failure and invariant tests. |
| R16 | Critical / Medium | 6 | Staff or member can directly update account balance or completed transaction through client/database API. | Theft or fabricated transaction history. | Remove browser write grants/policies, privileged database functions with validation, append-only ledger; direct mutation denial tests. |
| R17 | High / Medium | 6 | Bank payout destination changed or disbursement initiated by compromised/over-privileged user. | Irreversible transfer to attacker. | Verified destination change process, MFA step-up, cooling period/second approval, amount limits, transaction alerts and audit; authorization tests in sandbox. |
| R18 | Medium / Medium | 7 | Realtime channel/filter or notification action URL exposes another user's data or directs user to malicious site. | Privacy leak/phishing. | Realtime RLS, server-controlled recipient/content, internal allowlisted URLs, unsubscribe on logout; cross-user and URL validation tests. |
| R19 | Medium / Medium | 7 | SMS configuration accidentally switches to paid provider or sends secrets/financial details. | Unexpected cost and sensitive-data disclosure. | Explicit allowlist and fail-closed provider config; `noop` default; redacted logs; outbound network assertion in default mode. |
| R20 | High / Medium | 1–7 | Missing alerting, backups, restore test, or incident procedure delays detection/recovery. | Extended outage, evidence loss, unrecoverable data. | Redacted security logs, alerts, tested backups/restore, secret rotation and incident plan; tabletop/restore evidence. |
| R21 | High / Medium | 1–7 | Dependency vulnerability, leaked key, insecure deployment configuration, or absent patch process. | Application/server compromise. | CI dependency and secret scanning, patch cadence, pinned/reviewed dependencies, separate environments, HTTPS/security headers; attach CI evidence. |
| R22 | High / Medium | 5 | Third-party scripts/XSS or unsafe rendering steals sessions or manipulates user actions. | Account takeover or fraudulent transaction initiation. | Safe rendering, input/output encoding, CSP, minimize third-party scripts, security headers, XSS test suite; never render untrusted HTML. |
| R23 | Medium / Medium | 1–7 | Login/claim/payment/export endpoints lack distributed rate limits and abuse monitoring. | Brute force, enumeration, denial of service, cost spikes. | Shared rate limiter, endpoint-specific thresholds, generic errors, provider quotas/alerts; tests for throttling across instances. |
| R24 | High / Medium | 2, 4, 6 | Tenant hard-delete cascades destroy financial/audit evidence or suspension leaves payment routes active. | Unrecoverable records or continued unauthorized financial activity. | Suspend/disable lifecycle, revoke sessions, disable payments, retention-safe deletion, non-cascading financial history; lifecycle tests and restore plan. |

### Risk acceptance

No **Critical** risk should be accepted for real-money operation without written approval by the accountable owner, documented compensating control, and a time-bound remediation plan. A student prototype may demonstrate mocked payment flows using synthetic data, clearly labeled as non-production.

---

## C. Stage-by-stage security matrix

The matrix assesses the written specifications, not a running implementation. Therefore no row is **Pass**. **Blocker** means the stage must not be used with live personal/financial data or real funds until the listed minimum controls are implemented and tested. **Fix** means the design needs correction; because the application itself is not verified, the corresponding release remains blocked until evidence exists.

| Stage | Status | What the stage currently specifies | Required security work before it can pass | Minimum evidence to present |
|---|---|---|---|---|
| **1 — Foundation, database, RLS, auth** | **Blocker** | Supabase Auth, roles, middleware guards, `get_auth_sacco_id()`, partial account/notification RLS. | Complete default-deny policies for every table and CRUD operation; `WITH CHECK`; protect role/tenant fields; validate server-side on every action; service-role boundary; safe `SECURITY DEFINER` function configuration; MFA for staff/admin; cross-tenant composite constraints. Middleware cannot be the only guard. | Reviewed migrations/grants; anonymous/member/staff/admin tests; SACCO A vs B read/write tests; direct API mutation-denial tests; MFA and session tests. |
| **2 — Super Admin and SACCO onboarding** | **Blocker** | Admin provisions SACCO and initial manager; spec suggests generating wallet ID and creating profile. | Replace automatic trust with application review/approval/provisioning states; role-protected, audited, idempotent provisioning; secure individual invites; verified provider-issued wallet; payment setup separate and default-disabled; no client-controlled status or role. | Illegal-state transition tests; invite acceptance/MFA test; duplicate provisioning test; wallet verification evidence in sandbox; tenant isolation check. |
| **3 — Bulk import and member activation** | **Blocker** | Staff CSV imports; activation token; WhatsApp link; NIN+phone self-claim and four-digit PIN; temporary PIN print slip. | Remove NIN+phone-only claim and temporary PIN; use verified, hashed, expiring, single-use enrollment token; prevent enumeration; server-side tenant derivation; import limits, validation, atomicity/idempotency; protect private exports and formula injection. | Token expiry/replay/guess tests; enumeration test; cross-tenant import tests; malicious CSV and CSV formula tests; no secrets/PII in logs. |
| **4 — Staff workspace, KYC, loans** | **Blocker** | KYC review, loan appraisal/approval/disbursement, reports and exports; some role checks are described. | Enforce permissions and tenant at each server/database operation; private KYC bucket; granular roles, step-up MFA, maker/checker and no self-approval; status transitions and KYC prerequisite in backend; scoped/rate-limited/formula-safe exports; audit actions. | Cross-tenant KYC/export test; member/unauthorized staff tests; loan transition and concurrent approval tests; private object access checks; audit evidence. |
| **5 — Member portal and PWA** | **Blocker** | Member balances, statements, receipts, KYC upload, realtime, PWA service worker; spec proposes offline balance display. | Never cache private financial/KYC/authenticated responses in service worker; enforce member ownership for every query/export/receipt; private KYC storage; logout cache clear; realtime authorization; secure headers/CSP. | Cross-member statement/receipt tests; service-worker cache inspection; logout on shared-device test; KYC bucket access test; realtime isolation test. |
| **6 — ioTec payments and ledger** | **Blocker — live-money release stop** | Provider client, shared webhook secret, wallet comparison, RPC balance update, disbursement, expected idempotency and double-entry. | Validate callback authenticity and replay; fetch/validate transaction before success or failure changes; compare wallet, expected amount, currency, reference and state; idempotent concurrent processing; atomic balance/status/journal transaction; verify RPC errors; ban client balance writes; secure payout/dual control and reconciliation. | Sandbox spoof/mismatch/replay/concurrency/failure tests; ledger debits equal credits; no balance change on invalid event; reconciliation report; independent review before live credentials. |
| **7 — Notifications, SMS, audit, hardening** | **Blocker** | Realtime notification, SMS `noop` default, audit logging and CSV exports; sample `NoopSmsProvider` logs phone/message to console. | RLS-scope subscriptions and writes; minimize notification content; safe internal action URLs; remove sensitive message/phone console logs; fail-closed SMS provider selection; secure audit/export access and formula-safe CSV; monitoring, backup restore, CI scanning, headers, incident plan. | Cross-user realtime test; outbound SMS network test; log redaction test; audit append-only/access test; export authorization test; CI and restore evidence. |

### Cross-stage release decision

- **Academic demonstration with synthetic data and mocked payments:** may proceed when the demo risks are understood and no production credentials/data are used.
- **Pilot with real member data but no real payments:** do not proceed until Stages 1–5 and 7 privacy/access controls pass, sensitive data handling is reviewed, and operational safeguards are in place.
- **Live-money transactions:** do not proceed until all stages pass, Stage 6 receives an independent payment/ledger review, the provider sandbox tests pass, backups/reconciliation/incident response are ready, and required organizational/legal checks have been completed with qualified local advice.

---

## D. Supervisor presentation: suggested 5-minute sequence

1. **Project and sensitive assets:** SACCO tenants, member identity, savings/loans, payments.
2. **Threat model:** cross-tenant leakage, account takeover, insider misuse, forged/replayed webhook, duplicate credit.
3. **Layered controls:** Supabase Auth + MFA; server-side authorization; RLS + tenant constraints; private KYC storage; atomic, idempotent ledger; audit and monitoring.
4. **Demonstration:** show two tenants and prove cross-tenant queries fail; show invalid/replayed payment webhook leaves balances unchanged; show unauthorized export denied. Use only a sandbox and synthetic records.
5. **Status and limitations:** explain the matrix honestly—specification is not implementation; show which checks pass, which remain blockers, and that no live funds are used until critical blockers are independently resolved.

**Supervisor sign-off fields (fill in during review):**

- Reviewer: ______________________________
- Date: __________________________________
- Tested commit/build: _____________________
- Critical blockers remaining: ______________
- Approved scope: ☐ synthetic demo ☐ test data ☐ production personal data ☐ live funds
- Conditions and follow-up date: ______________
