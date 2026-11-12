import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Terms</h1>
        <p className="mt-4 text-slate-600">This is a secure prototype and educational foundation for a SACCO management platform. It should not be deployed for real financial data until security review, testing, and provider validation are complete.</p>
        <Link href="/" className="mt-8 inline-block font-semibold text-brand-700">Back home</Link>
      </div>
    </main>
  );
}
