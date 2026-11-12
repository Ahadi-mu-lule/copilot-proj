import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-xl font-bold text-white">F</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Sign in to FlexSACCO</h1>
          <p className="mt-2 text-sm text-slate-500">Security-first access for staff, admin, and members</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Demo role access</p>
            <p className="mt-1 text-sm text-slate-500">Use the secure role gates to route all access through the correct SACCO and permission layer.</p>
          </div>
          <Link href="/portal" className="block rounded-xl bg-brand-700 px-4 py-3 text-center font-semibold text-white">
            Continue as member
          </Link>
          <Link href="/workspace" className="block rounded-xl border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">
            Continue as staff
          </Link>
          <Link href="/admin" className="block rounded-xl border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700">
            Continue as platform admin
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Need access? <Link href="/request-demo" className="font-semibold text-brand-700">Request a demo</Link>
        </div>
      </div>
    </main>
  );
}
