# SACCO Onboarding Flow and Marketing Landing Page

This document defines the first public-facing experience and the controlled SACCO onboarding workflow for FlexSACCO. It is an implementation specification for the existing blueprint repository; the repository does not yet contain a Next.js application to implement or run these screens.

## Goals

- Explain FlexSACCO clearly to Ugandan SACCO decision-makers and convert interest into a demo request.
- Keep public marketing pages separate from authenticated tenant workspaces.
- Onboard SACCOs through review, verification, provisioning, and training rather than granting immediate access after a public signup.
- Keep payment setup disabled until the payment provider and tenant wallet are verified.
- Use honest, supportable claims. Do not invent customer numbers, testimonials, partnerships, certifications, uptime figures, or regulatory approvals.

## 1. Routes and visitor experience

Public routes:

- `/` — marketing landing page
- `/request-demo` — demo/contact request form
- `/privacy` and `/terms` — public policies, reviewed before production
- `/login` — authenticated-user entry point, linked discreetly from the header

Private routes remain behind authentication and authorization:

- `/admin` — FlexSACCO platform administration
- `/workspace` — SACCO staff workspace
- `/portal` — SACCO member portal

The landing page must not expose member data, tenant dashboards, internal application records, or payment credentials. Public demo requests must not create active SACCO tenants or Supabase Auth users.

## 2. Landing page structure and draft copy

### Header

- FlexSACCO wordmark and concise navigation: Platform, How it works, Security, FAQ.
- Primary CTA: **Request a demo**.
- Secondary link: **Log in**.
- Mobile navigation must be keyboard accessible and work at narrow screen widths.

### Hero

**Headline:** A clearer way to manage your SACCO.

**Supporting copy:** FlexSACCO is a management platform concept for Ugandan savings and credit cooperatives—bringing member records, savings, loans, and operational workflows into one place.

**Primary CTA:** Request a demo

**Secondary CTA:** Explore the platform

Use a real product screenshot or clearly labeled prototype image when available. Do not imply that payment integrations, security certifications, or production capabilities are live until verified. If this is still a student prototype, label it clearly as a prototype and avoid collecting real member financial or identity data.

### Problem/benefit section

Present three to four benefit cards using outcomes, not unsupported numerical promises:

- **Member records in one place** — organize member profiles and account information with role-appropriate access.
- **Loan workflows** — track applications, reviews, and decisions through a defined process.
- **Savings and transaction visibility** — give authorized staff and members relevant account and transaction views.
- **Designed for local operations** — prioritize mobile-friendly access and practical workflows for Ugandan SACCO teams.

Only advertise modules that are implemented and demonstrable. Label planned functionality as “in development” rather than implying availability.

### Product overview

Show the main workflow with product screenshots or a short walkthrough:

1. Staff manage member records.
2. Authorized staff review loan applications.
3. Members access their own information through the member portal.
4. Payments, if and when enabled, are handled through a verified provider integration and recorded in the ledger.

Do not use real member names, NINs, phone numbers, balances, or transaction data in public screenshots. Use synthetic demo data.

### Security and trust

Explain controls in plain language and state only what has actually been implemented and verified. Appropriate topics include:

- Tenant-separated access design.
- Role-based permissions and database access controls.
- Protected administrative access and auditability.
- Payment processing through a configured provider, only once that integration is operational.
- Privacy contact and links to the privacy policy.

Do not display ISO, PCI DSS, Bank of Uganda, URSB, partner, customer, encryption, data-location, or compliance badges/claims unless there is evidence and authorization to make that claim. Avoid claiming “bank-grade security,” “fully compliant,” or “unhackable.”

### How onboarding works

1. Request a walkthrough.
2. FlexSACCO contacts the SACCO to understand its workflows and requirements.
3. Authorized representatives and organization details are reviewed.
4. A tenant is provisioned after approval and agreed setup.
5. Staff are invited individually and trained before any live operation.

Clarify that submitting a demo request is not approval, account creation, payment onboarding, or a commitment to use the service.

### FAQ

Suggested questions:

- **Who is FlexSACCO for?** Savings and credit cooperatives evaluating a digital platform for member and operational workflows.
- **Can we try a demo?** Yes; use the demo request form to arrange a walkthrough. Any demo environment should use synthetic data.
- **How is our SACCO onboarded?** Applications are reviewed before tenant provisioning; access and payment setup are separate controlled steps.
- **Can members use the platform on a phone?** Describe responsive/mobile functionality only after it has been tested on supported devices.
- **Does it process mobile money today?** State the current verified integration status. If it is not live, say it is planned or under development.
- **How is member data protected?** Summarize actual controls and link to the privacy policy; do not make unsupported guarantees.

### Final CTA and footer

Repeat **Request a demo** and provide verified business contact details. Footer links: Privacy, Terms, Contact, and Login. Do not publish a personal phone number or office address without permission. Add language options only when translations and support are available.

## 3. Demo request form

Collect only what is needed to respond:

- SACCO/organization name
- Contact person's name
- Work email or phone (at least one required)
- Role/title (optional)
- Approximate member count (optional ranges, not exact records)
- Main area of interest (select list)
- Preferred contact method and time (optional)
- Consent checkbox linked to the privacy notice

Do not request NINs, member lists, passwords, bank account details, financial statements, or payment credentials in a public form.

Server-side requirements:

- Validate and normalize all fields; limit lengths and accepted formats.
- Use a shared rate limiter and bot mitigation; do not rely only on client-side validation.
- Store submissions in a private lead table or an approved CRM, not in a public table.
- Restrict lead access to designated platform personnel; enable RLS and default-deny policies if stored in Supabase.
- Return a generic success response and avoid revealing whether an email/phone already exists.
- Escape output on display and protect against spam and unsafe links.
- Record consent timestamp and privacy-notice version. Define retention and deletion procedures.
- Never create a tenant, issue login credentials, or trigger payment provisioning from this public form.

## 4. SACCO onboarding lifecycle

### Lifecycle states

Use a controlled lifecycle, persisted and transitioned server-side:

`application_pending → under_review → approved → provisioning → setup_required → active`

Terminal/exception states: `rejected`, `withdrawn`, `suspended`.

Only allow documented transitions. Every transition records actor, timestamp, prior state, new state, and a reason where applicable. A browser client must not write lifecycle state directly.

### Step A: Application intake

An authorized platform operator creates an application from a demo request or an assisted onboarding conversation. Track the application ID, organization details, contact person, submission source, consent where relevant, and status. Minimize document collection; use a restricted upload mechanism only if documents are necessary.

### Step B: Review and verification

A designated reviewer verifies the organization's identity and the authority of its representative using the process approved for the service. Record a decision and verification checklist without putting sensitive documents in general staff-visible storage. This blueprint does not define Ugandan legal obligations; obtain local legal/compliance advice before launch.

Require a second reviewer for high-impact decisions where practical. Do not approve an organization solely because the form is complete.

### Step C: Approval and tenant provisioning

Only an authenticated platform administrator with the explicit provisioning permission may approve and provision a SACCO.

In one server-controlled operation:

- Create the tenant with a generated UUID and unique slug.
- Set its status to `setup_required` (not active).
- Record the approving actor and application reference.
- Create an onboarding checklist and audit event.
- Do not create a shared password or allow the applicant to choose a role or tenant ID.

Provisioning must be idempotent: retrying the operation must not create duplicate tenants or administrator invitations.

### Step D: Payment account setup (separate gate)

Payment setup is optional and disabled by default. If required:

- Obtain/confirm the wallet identifier through the payment provider's authorized process; never invent a provider wallet ID.
- Verify the wallet is associated with the approved SACCO through provider evidence or an authorized provider workflow.
- Store only necessary provider identifiers and keep credentials in server-side secret storage.
- Configure and test the webhook in a sandbox. Validate authenticity, tenant/wallet mapping, expected amount/currency, idempotency, and atomic ledger handling.
- Record the operator and verification evidence reference, not secrets.
- Keep collections/disbursements disabled until all checks pass and a separately authorized operator enables them.

### Step E: First administrator invitation

Invite the approved organization's named administrator individually using a secure Supabase Auth invitation/verification flow. The administrator sets their own credential; no shared/default password is generated. Require MFA for staff/admin roles before access to operational functions. Expiring or revoked invitations cannot be reused.

Assign the initial `sacco_admin` role and `sacco_id` only in trusted server/database logic after validating the approved onboarding record. Never accept role or tenant assignment from submitted form data. Audit every invitation, acceptance, role change, and revocation.

### Step F: SACCO setup and training

Before activation, complete a checklist:

- Confirm organization name, slug, authorized administrator, and contact channel.
- Configure SACCO settings and approved staff roles.
- Review data-import template and privacy handling.
- Train staff using synthetic or properly authorized test data.
- Test tenant isolation and audit access.
- Confirm recovery, support, and offboarding contacts.
- Complete sandbox payment validation if payments will be enabled.

Only a designated platform operator can transition `setup_required` to `active`. Activation must not automatically enable real-money payment flows.

### Step G: Suspension and offboarding

A designated operator can suspend a tenant. Suspension should block new sign-ins or sensitive operations according to policy, disable payment initiation, revoke/review active sessions, and preserve audit records as required. Define a documented export, retention, and deletion process before launch. Avoid hard-deleting financial audit history through cascading tenant deletion.

## 5. Suggested data model

Use a separate onboarding application table rather than mixing unverified applications into the active tenant table. Example fields (adapt with reviewed migrations):

- `sacco_applications`: `id`, `organization_name`, `registration_reference` (only if needed), contact fields, `status`, `submitted_at`, `reviewed_at`, `reviewed_by`, `decision_reason`, `created_tenant_id`, timestamps.
- `sacco_onboarding_checks`: `id`, `application_id`, `check_type`, `status`, `completed_by`, `completed_at`, non-sensitive evidence reference.
- `sacco_invites`: `id`, `sacco_id`, invited email/phone, intended role, token hash or Auth invitation reference, expiration, accepted/revoked timestamps, creator.
- `audit_events`: append-only events for application decisions, tenant provisioning, payment setup, invitations, activation, suspension, and role changes.

Use RLS and grants so the public has no direct access to these tables. Use foreign keys, uniqueness constraints, and explicit role checks. Store sensitive verification documents in a private bucket with short-lived signed access and restrictive policies, if documents must be retained at all.

## 6. Permissions and separation of duties

- Public visitors: can submit a rate-limited demo request only.
- Onboarding reviewer: can view assigned applications and record review outcomes; cannot create payment credentials.
- Platform provisioner: can provision an approved SACCO; actions are audited.
- Payment setup operator: can register/verify provider configuration; cannot unilaterally approve their own organization review where separation of duties is required.
- SACCO administrator: manages users within their own SACCO, subject to policy; cannot change the SACCO's tenant ID, provider wallet, or platform status.
- SACCO staff/member: access only the functionality and data permitted for their role and tenant.

Apply least privilege and maker/checker approval for sensitive setup and financial operations. The exact roles may differ, but each permission must be enforced server-side and at the database boundary.

## 7. Acceptance criteria

### Landing page

- Public pages load without authentication and contain no private tenant data.
- Main value proposition and demo CTA are understandable on desktop and mobile.
- Navigation and form are keyboard accessible and have labels, validation messages, and visible focus states.
- Copy does not claim unsupported customer, payment, security, certification, or compliance status.
- Form submission is validated server-side, rate-limited, consent-aware, and does not create an active tenant.
- Screenshots and sample content contain only synthetic data.

### Onboarding

- A public demo submission cannot create a tenant, user, role, or payment wallet.
- Unapproved applications cannot be provisioned.
- Only permitted platform users can review, approve, provision, activate, suspend, or reject an application.
- Every status transition is validated and audited; illegal transitions fail.
- Repeated provisioning/invitation requests are safe and idempotent.
- A tenant cannot access another tenant's application, members, accounts, or records.
- Tenant activation does not imply live payment enablement.
- Wallet mismatch, missing verification, or incomplete setup blocks payment enablement.
- Invitations expire, are single-use, and do not contain shared credentials.
- Tests cover anonymous access, role enforcement, tenant isolation, duplicate requests, and suspension behavior.

## 8. Suggested build sequence

1. Build the public landing page and demo request endpoint using synthetic content.
2. Add private application and review workflow with default-deny access.
3. Implement audited, idempotent tenant provisioning and secure administrator invitations.
4. Add setup checklist, role assignment, and suspension/offboarding behavior.
5. Add sandbox payment onboarding as a separate gated feature.
6. Run accessibility, privacy, authorization, tenant-isolation, and abuse-control tests before public launch.
