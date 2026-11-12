import Link from 'next/link';

export default function ClaimAccountPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Claim your SACCO account</h1>
        <p className="mt-3 text-slate-600">Account enrollment is not enabled in this prototype. For your safety, this page does not collect your NIN or phone number and does not use NIN + phone as proof of identity.</p>
        <p className="mt-4 text-slate-600">Contact your SACCO administrator through a verified channel to receive an approved, single-use enrollment invitation.</p>
        <Link href="/login" className="mt-6 inline-block rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white">Go to sign in</Link>
      </div>
    </main>
  );
}
