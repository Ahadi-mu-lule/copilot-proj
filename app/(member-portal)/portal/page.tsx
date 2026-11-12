import Link from 'next/link';

export default function PortalPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Member portal</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, John</h1>
        </div>
        <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          Sign out
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {[
          ['Savings balance', 'UGX 1.25M'],
          ['Share capital', 'UGX 850K'],
          ['Loan balance', 'UGX 2.30M'],
          ['KYC status', 'Verified'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
