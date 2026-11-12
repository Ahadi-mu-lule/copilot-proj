import Link from 'next/link';

export default function ClaimAccountPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Claim your SACCO account</h1>
        <p className="mt-2 text-slate-600">Only use this flow if your SACCO has already verified your onboarding record. This route is protected and must be server-validated.</p>

        <form className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">SACCO name</label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" placeholder="Kampala SACCO" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" placeholder="2567XXXXXXXX" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">National ID / NIN</label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" placeholder="CM1234567890" />
          </div>
          <button type="button" className="w-full rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white">
            Verify and continue
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already activated? <Link href="/login" className="font-semibold text-brand-700">Log in</Link>
        </div>
      </div>
    </main>
  );
}
