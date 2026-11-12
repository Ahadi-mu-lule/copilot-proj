import Link from 'next/link';

const benefits = [
  {
    title: 'Member record management',
    description: 'Keep member profiles, account records, and SACCO data organized in a single, role-aware system.',
  },
  {
    title: 'Loan and approval workflows',
    description: 'Track applications, approvals, and disbursement stages with a controlled, auditable process.',
  },
  {
    title: 'Secure multi-tenant access',
    description: 'Every SACCO is isolated so staff and members can only access their own tenant data.',
  },
  {
    title: 'Prepared for mobile operations',
    description: 'Designed for mobile-first member access and low-bandwidth environments common in cooperative operations.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto max-w-7xl px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-lg font-bold text-white">
              F
            </div>
            <div>
              <div className="text-lg font-bold">FlexSACCO</div>
              <div className="text-xs text-slate-500">Uganda cooperatives</div>
            </div>
          </div>
          <div className="hidden gap-8 text-sm text-slate-600 md:flex">
            <Link href="#platform">Platform</Link>
            <Link href="#security">Security</Link>
            <Link href="#workflow">Workflow</Link>
            <Link href="#contact">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
              Log in
            </Link>
            <Link href="/request-demo" className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-soft">
              Request a demo
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
            Secure operations for SACCOs
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
            Empower your SACCO with a safer digital operations platform.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600">
            FlexSACCO helps cooperatives manage members, savings, shares, loan review, and operational workflows in a secure, multi-tenant system built for trusted Ugandan financial operations.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/request-demo" className="rounded-full bg-brand-700 px-6 py-3 text-base font-semibold text-white shadow-soft">
              Request a demo
            </Link>
            <Link href="#platform" className="rounded-full border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700">
              Explore platform
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-8 text-sm text-slate-500">
            <div><span className="font-bold text-slate-900">Tenant isolated</span><br />Protected data access</div>
            <div><span className="font-bold text-slate-900">Role-based</span><br />Secure admin workflows</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="rounded-2xl bg-slate-100 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Platform overview</p>
                <h2 className="text-2xl font-bold text-slate-900">Kampala SACCO</h2>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                Active
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="text-sm text-slate-500">Savings</p>
                <p className="mt-2 text-2xl font-bold text-brand-900">UGX 14.2M</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Loans</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">UGX 9.5M</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Members</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">2,450</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Approvals</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">11</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Platform</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Built for cooperative operations from onboarding to approval.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-lg font-bold text-brand-800">
                ✓
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Security-first</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">Every layer is built to limit access and protect financial trust.</h2>
              <ul className="mt-6 space-y-4 text-slate-600">
                <li>• Role-based access for admins, staff, and members</li>
                <li>• Tenant-scoped data access with default-deny policies</li>
                <li>• Server-side validation before any financial or administrative action</li>
                <li>• Audit-ready workflows and restricted operational access</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-soft">
              <div className="rounded-2xl bg-white p-5">
                <p className="text-sm text-slate-500">Security posture</p>
                <div className="mt-5 space-y-5">
                  {[
                    ['Authentication', 'MFA + server-side validation'],
                    ['Authorization', 'Role + tenant checks'],
                    ['Payments', 'Sandboxed and verified before activation'],
                    ['Audit trail', 'Operational decisions logged'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="text-sm text-brand-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Workflow</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">From onboarding to operations, all steps can be reviewed and controlled.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['1. Apply', 'SACCOs request a demo or onboarding review.'],
            ['2. Review', 'Platform reviewers verify tenant setup and permissions.'],
            ['3. Operate', 'Staff and members access only the tools and records for their role.'],
          ].map(([step, text]) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">{step}</div>
              <p className="text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to modernize your SACCO operations?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-100">
            Arrange a demo and discuss secure onboarding, member management, approvals, and operational workflows for your cooperative.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/request-demo" className="rounded-full bg-white px-6 py-3 font-semibold text-brand-900">
              Request a demo
            </Link>
            <Link href="/login" className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white">
              Member or staff login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
