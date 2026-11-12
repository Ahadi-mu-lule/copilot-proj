import { signOutAction } from '@/app/(auth)/login/actions';
import { requireUserProfile } from '@/lib/auth/guards';

export default async function AdminPage() {
  const profile = await requireUserProfile(['super_admin']);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">Platform admin</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome, {profile.full_name}</h1>
          <p className="mt-2 text-sm text-slate-600">Stage 1 foundation. No platform data is connected.</p>
        </div>
        <form action={signOutAction}><button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Sign out</button></form>
      </div>
    </main>
  );
}
