import Link from 'next/link';

export default function WorkspacePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">SACCO workspace</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Kampala SACCO dashboard</h1>
        </div>
        <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          Sign out
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {[
          ['Members', '2,450'],
          ['Total savings', 'UGX 14.2M'],
          ['Shares', 'UGX 8.9M'],
          ['Loan portfolio', 'UGX 9.5M'],
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
