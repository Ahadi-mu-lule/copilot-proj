import Link from 'next/link';
import { signInAction } from './actions';

export default function LoginPage({ searchParams }: { searchParams?: { next?: string; error?: string } }) {
  const errorMessage = searchParams?.error
    ? 'Sign-in failed or this account is not authorized. Check your details or contact your SACCO administrator.'
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-xl font-bold text-white">F</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Sign in to FlexSACCO</h1>
          <p className="mt-2 text-sm text-slate-500">Use the account invited by your SACCO administrator.</p>
        </div>

        {errorMessage && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>}

        <form action={signInAction} className="space-y-5">
          <input type="hidden" name="next" value={searchParams?.next ?? ''} />
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white">Sign in</button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Need access? <Link href="/request-demo" className="font-semibold text-brand-700">Request a demo</Link>
        </p>
      </div>
    </main>
  );
}
