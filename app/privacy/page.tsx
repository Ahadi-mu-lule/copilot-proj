import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Privacy</h1>
        <p className="mt-4 text-slate-600">This project is a security-first foundation for SACCO operations. Personal data is treated as sensitive and should only be stored in a protected environment with strict role-based access and database policies.</p>
        <div className="mt-6 space-y-3 text-slate-600">
          <p>• Access is granted according to the authenticated user role and assigned SACCO.</p>
          <p>• Financial and KYC data must be protected by server-side validation and database-layer controls.</p>
          <p>• Audit logs and operational actions should be retained and reviewed.</p>
        </div>
        <Link href="/" className="mt-8 inline-block font-semibold text-brand-700">Back home</Link>
      </div>
    </main>
  );
}
